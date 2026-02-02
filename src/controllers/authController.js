// src/controllers/authController.js
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { supabase } = require('../config/database');
const { sendPasswordResetEmail, sendEmailVerificationCode } = require('../services/emailService');

/**
 * Generar JWT token
 */
function generateToken(user) {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      role: user.role
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

/**
 * Registro de nuevo usuario
 * POST /api/auth/register
 */
async function register(req, res) {
  try {
    const { email, password, full_name, phone, verification_token } = req.body;
    
    // SEGURIDAD: Forzar que todos los registros públicos sean 'owner'
    // Los super_admin solo se crean directamente en la base de datos
    const role = 'owner';
    
    // Validaciones básicas (el middleware de validación ya hace la mayoría)
    if (!email || !password || !full_name) {
      return res.status(400).json({
        error: 'Datos incompletos',
        message: 'Email, contraseña y nombre completo son requeridos'
      });
    }
    
    // Para owners, el teléfono es OBLIGATORIO (evita múltiples cuentas free)
    if (!phone) {
      return res.status(400).json({
        error: 'Teléfono requerido',
        message: 'El número de teléfono es obligatorio para crear una cuenta'
      });
    }
    
    // Limpiar teléfono
    const cleanPhone = phone ? phone.replace(/\D/g, '') : null;
    
    // Detectar país desde el código de teléfono
    const countryMap = {
      '51': 'PE',    // Perú
      '54': 'AR',    // Argentina
      '591': 'BO',   // Bolivia
      '55': 'BR',    // Brasil
      '56': 'CL',    // Chile
      '57': 'CO',    // Colombia
      '506': 'CR',   // Costa Rica
      '53': 'CU',    // Cuba
      '593': 'EC',   // Ecuador
      '503': 'SV',   // El Salvador
      '34': 'ES',    // España
      '502': 'GT',   // Guatemala
      '504': 'HN',   // Honduras
      '52': 'MX',    // México
      '505': 'NI',   // Nicaragua
      '507': 'PA',   // Panamá
      '595': 'PY',   // Paraguay
      '1809': 'DO',  // República Dominicana
      '598': 'UY',   // Uruguay
      '58': 'VE',    // Venezuela
      '1': 'US'      // Estados Unidos
    };
    
    let detectedCountry = null;
    if (cleanPhone) {
      // Intentar detectar país por código
      for (const [code, country] of Object.entries(countryMap)) {
        if (cleanPhone.startsWith(code)) {
          detectedCountry = country;
          break;
        }
      }
    }
    
    // Para owners, verificar que el teléfono esté verificado con Firebase
    if (role === 'owner' && cleanPhone) {
      // Verificar token de Firebase
      if (!verification_token) {
        return res.status(400).json({
          error: 'Verificación requerida',
          message: 'Debes verificar tu número de teléfono antes de registrarte'
        });
      }
      
      try {
        // Verificar el token de Firebase
        const admin = require('firebase-admin');
        const decodedToken = await admin.auth().verifyIdToken(verification_token);
        
        // Extraer el teléfono del token de Firebase
        const firebasePhone = decodedToken.phone_number;
        
        if (!firebasePhone) {
          return res.status(400).json({
            error: 'Verificación inválida',
            message: 'El token no contiene información de teléfono verificado'
          });
        }
        
        // Comparar números (limpiar el de Firebase también)
        const firebasePhoneClean = firebasePhone.replace(/\D/g, '');
        const expectedPhone = cleanPhone.startsWith('51') ? cleanPhone : `51${cleanPhone}`;
        
        // Permitir coincidencia exacta o con prefijo
        // Nota: Firebase devuelve formato internacional (+51999...), cleanPhone puede o no tenerlo
        if (!firebasePhoneClean.endsWith(cleanPhone) && firebasePhoneClean !== expectedPhone) {
          console.log(`❌ Teléfono no coincide: Firebase=${firebasePhoneClean}, Esperado=${expectedPhone}`);
          return res.status(400).json({
            error: 'Verificación inválida',
            message: 'El número verificado no corresponde al ingresado'
          });
        }
        
        console.log(`✅ Teléfono verificado con Firebase: ${firebasePhone}`);
        
      } catch (firebaseError) {
        console.error('Error verificando token Firebase:', firebaseError);
        return res.status(400).json({
          error: 'Verificación expirada',
          message: 'El token de verificación ha expirado o es inválido. Verifica tu número nuevamente.'
        });
      }
    }
    
    // Verificar si el email ya existe
    const { data: existingEmail } = await supabase
      .from('users')
      .select('id')
      .eq('email', email.toLowerCase())
      .single();
    
    if (existingEmail) {
      return res.status(409).json({
        error: 'Email ya registrado',
        message: 'Ya existe una cuenta con este email'
      });
    }
    
    // Verificar si el teléfono ya existe (para evitar múltiples cuentas free)
    if (cleanPhone) {
      const { data: existingPhone } = await supabase
        .from('users')
        .select('id, role')
        .eq('phone', cleanPhone)
        .single();
      
      if (existingPhone) {
        return res.status(409).json({
          error: 'Teléfono ya registrado',
          message: 'Ya existe una cuenta con este número de teléfono'
        });
      }
      
      // Verificar si el teléfono está registrado como trabajador en alguna tienda
      const { data: existingWorker } = await supabase
        .from('workers')
        .select('id, temp_full_name, registration_status')
        .eq('temp_phone', cleanPhone)
        .in('registration_status', ['pending', 'completed'])
        .limit(1);
      
      if (existingWorker && existingWorker.length > 0) {
        const worker = existingWorker[0];
        const status = worker.registration_status === 'pending' 
          ? 'pendiente de registro' 
          : 'ya registrado';
        
        return res.status(409).json({
          error: 'Teléfono registrado como trabajador',
          message: `Este número de teléfono está ${status} como trabajador en otra tienda. No puedes crear una cuenta de dueño con este número.`
        });
      }
    }
    
    // Hashear contraseña
    const password_hash = await bcrypt.hash(password, 10);
    
    // Crear usuario en la base de datos
    const { data: user, error } = await supabase
      .from('users')
      .insert({
        email: email.toLowerCase(),
        password_hash,
        full_name,
        phone: cleanPhone,
        role,
        country: detectedCountry
      })
      .select('id, email, full_name, phone, role, country, created_at')
      .single();
    
    if (error) {
      console.error('Error al crear usuario:', error);
      throw error;
    }
    
    // Generar token JWT
    const token = generateToken(user);
    
    res.status(201).json({
      success: true,
      message: 'Usuario registrado exitosamente',
      data: {
        user: {
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          phone: user.phone,
          role: user.role,
          created_at: user.created_at
        },
        token
      }
    });
    
  } catch (error) {
    console.error('Error en register:', error);
    res.status(500).json({
      error: 'Error al registrar usuario',
      message: 'Hubo un problema al crear tu cuenta. Por favor intenta nuevamente.'
    });
  }
}

/**
 * Inicio de sesión
 * POST /api/auth/login
 * Body: { email OR phone, password }
 */
async function login(req, res) {
  try {
    const { email, phone, password } = req.body;
    
    if ((!email && !phone) || !password) {
      return res.status(400).json({
        error: 'Datos incompletos',
        message: 'Email o teléfono y contraseña son requeridos'
      });
    }
    
    // Buscar usuario por email O teléfono
    let user;
    
    if (email) {
      const { data, error } = await supabase
        .from('users')
        .select('id, email, password_hash, full_name, phone, role, is_active')
        .eq('email', email.toLowerCase())
        .maybeSingle();
      
      if (error) throw error;
      user = data;
    } else {
      // Normalizar teléfono de entrada
      let searchPhone = phone.trim();
      
      // Intento 1: Buscar exacto
      let { data, error } = await supabase
        .from('users')
        .select('id, email, password_hash, full_name, phone, role, is_active, country')
        .eq('phone', searchPhone)
        .maybeSingle();
      
      // Intento 2: Si no se encontró y NO tiene +, intentar con +
      if (!data && !searchPhone.startsWith('+')) {
        const { data: data2 } = await supabase
          .from('users')
          .select('id, email, password_hash, full_name, phone, role, is_active, country')
          .eq('phone', `+${searchPhone}`)
          .maybeSingle();
        
        data = data2;
      }
      
      // NO hacer búsqueda por "termina con" para evitar ambigüedad entre países
      
      if (error && error.code !== 'PGRST116') throw error;
      user = data;
    }
    
    if (!user) {
      return res.status(401).json({
        error: 'Credenciales inválidas',
        message: 'Email/teléfono o contraseña incorrectos'
      });
    }
    
    // Verificar si la cuenta está activa
    if (!user.is_active) {
      return res.status(403).json({
        error: 'Cuenta desactivada',
        message: 'Tu cuenta ha sido desactivada. Contacta al administrador.'
      });
    }
    
    // Verificar contraseña
    let isPasswordValid = false;
    
    // Si el password_hash es 'supabase_auth', verificar con Supabase Auth
    if (user.password_hash === 'supabase_auth') {
      try {
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email: user.email,
          password: password
        });
        
        isPasswordValid = !authError && authData.user !== null;
      } catch (authErr) {
        console.error('Error en auth de Supabase:', authErr);
        isPasswordValid = false;
      }
    } else {
      // Verificar con bcrypt (método tradicional)
      isPasswordValid = await bcrypt.compare(password, user.password_hash);
    }
    
    if (!isPasswordValid) {
      return res.status(401).json({
        error: 'Credenciales inválidas',
        message: 'Email o contraseña incorrectos'
      });
    }
    
    // Actualizar fecha de último login
    await supabase
      .from('users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', user.id);
    
    // Generar token JWT
    const token = generateToken(user);
    
    res.json({
      success: true,
      message: 'Inicio de sesión exitoso',
      data: {
        user: {
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          phone: user.phone,
          role: user.role,
          country: user.country || 'PE' // Incluir país (default Perú)
        },
        token
      }
    });
    
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({
      error: 'Error al iniciar sesión',
      message: 'Hubo un problema al procesar tu solicitud. Por favor intenta nuevamente.'
    });
  }
}

/**
 * Obtener perfil del usuario autenticado
 * GET /api/auth/me
 */
async function getProfile(req, res) {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, full_name, phone, phone_verified, role, is_active, created_at, last_login')
      .eq('id', req.user.userId)
      .single();
    
    if (error) {
      console.error('Error al obtener perfil:', error);
      throw error;
    }
    
    if (!user) {
      return res.status(404).json({
        error: 'Usuario no encontrado'
      });
    }
    
    // Si es owner, obtener información de su tienda
    let store = null;
    if (user.role === 'owner') {
      const { data: storeData } = await supabase
        .from('stores')
        .select('id, name, description, address, phone, is_active')
        .eq('owner_id', user.id)
        .single();
      
      store = storeData;
    }
    
    // Si es worker, obtener la tienda donde trabaja
    if (user.role === 'worker') {
      const { data: workerData } = await supabase
        .from('workers')
        .select('stores(id, name, description, address, phone, is_active)')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single();
      
      store = workerData?.stores;
    }
    
    res.json({
      success: true,
      data: { 
        user,
        store,
        subscription: {
          plan: 'Free',
          status: 'active'
        }
      }
    });
    
  } catch (error) {
    console.error('Error en getProfile:', error);
    res.status(500).json({
      error: 'Error al obtener perfil',
      message: 'No se pudo cargar la información del usuario'
    });
  }
}

/**
 * Actualizar perfil del usuario autenticado
 * PUT /api/auth/profile
 */
async function updateProfile(req, res) {
  try {
    const { full_name, phone, country } = req.body;
    const userId = req.user.userId;
    
    // Si se está actualizando el teléfono, validar que no exista en otro usuario
    if (phone) {
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('id, country')
        .eq('phone', phone)
        .neq('id', userId)
        .maybeSingle();
      
      if (checkError) {
        console.error('Error al verificar teléfono:', checkError);
      }
      
      if (existingUser) {
        // Si el país es el mismo, el número definitivamente está duplicado
        if (existingUser.country === (country || req.user.country)) {
          return res.status(400).json({
            success: false,
            error: 'Teléfono en uso',
            message: 'Este número de teléfono ya está registrado en tu país'
          });
        }
        
        // Incluso si es de otro país, advertir (puede ser fraude)
        return res.status(400).json({
          success: false,
          error: 'Teléfono en uso',
          message: 'Este número de teléfono ya está registrado'
        });
      }
    }
    
    // Preparar campos a actualizar
    const updates = {
      updated_at: new Date().toISOString()
    };
    
    if (full_name) updates.full_name = full_name;
    if (phone !== undefined) {
      // Si se cambia el teléfono, marcarlo como no verificado
      updates.phone = phone;
      
      // Obtener el teléfono actual del usuario
      const { data: currentUser } = await supabase
        .from('users')
        .select('phone')
        .eq('id', userId)
        .single();
      
      // Solo marcar como no verificado si el teléfono cambió
      if (currentUser && currentUser.phone !== phone) {
        updates.phone_verified = false;
      }
    }
    if (country) updates.country = country;
    
    // Actualizar en la base de datos
    const { data: user, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select('id, email, full_name, phone, phone_verified, role, country, updated_at')
      .single();
    
    if (error) {
      console.error('Error al actualizar perfil:', error);
      throw error;
    }
    
    res.json({
      success: true,
      message: 'Perfil actualizado exitosamente',
      data: { user }
    });
    
  } catch (error) {
    console.error('Error en updateProfile:', error);
    res.status(500).json({
      success: false,
      error: 'Error al actualizar perfil',
      message: 'No se pudo actualizar tu información'
    });
  }
}

/**
 * Cambiar contraseña
 * PUT /api/auth/change-password
 */
async function changePassword(req, res) {
  try {
    const { current_password, new_password } = req.body;
    const userId = req.user.userId;
    
    if (!current_password || !new_password) {
      return res.status(400).json({
        error: 'Datos incompletos',
        message: 'Contraseña actual y nueva contraseña son requeridas'
      });
    }
    
    if (new_password.length < 8) {
      return res.status(400).json({
        error: 'Contraseña inválida',
        message: 'La nueva contraseña debe tener al menos 8 caracteres'
      });
    }
    
    // Obtener usuario actual
    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('password_hash')
      .eq('id', userId)
      .single();
    
    if (fetchError || !user) {
      return res.status(404).json({
        error: 'Usuario no encontrado'
      });
    }
    
    // Verificar contraseña actual
    const isCurrentPasswordValid = await bcrypt.compare(current_password, user.password_hash);
    
    if (!isCurrentPasswordValid) {
      return res.status(401).json({
        error: 'Contraseña incorrecta',
        message: 'La contraseña actual no es correcta'
      });
    }
    
    // Hashear nueva contraseña
    const new_password_hash = await bcrypt.hash(new_password, 10);
    
    // Actualizar contraseña
    const { error: updateError } = await supabase
      .from('users')
      .update({
        password_hash: new_password_hash,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);
    
    if (updateError) {
      console.error('Error al cambiar contraseña:', updateError);
      throw updateError;
    }
    
    res.json({
      success: true,
      message: 'Contraseña actualizada exitosamente'
    });
    
  } catch (error) {
    console.error('Error en changePassword:', error);
    res.status(500).json({
      error: 'Error al cambiar contraseña',
      message: 'No se pudo actualizar tu contraseña'
    });
  }
}

/**
 * Registrar/actualizar token FCM del dispositivo
 * POST /api/auth/fcm-token
 */
async function registerFCMToken(req, res) {
  try {
    const { token, device_type = 'android' } = req.body;
    const userId = req.user.userId;
    
    if (!token) {
      return res.status(400).json({
        error: 'Token requerido',
        message: 'El token FCM es requerido'
      });
    }
    
    // Insertar o actualizar token (upsert)
    const { error } = await supabase
      .from('fcm_tokens')
      .upsert({
        user_id: userId,
        token,
        device_type,
        is_active: true,
        created_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,token'
      });
    
    if (error) {
      console.error('Error al registrar token FCM:', error);
      throw error;
    }
    
    res.json({
      success: true,
      message: 'Token FCM registrado exitosamente'
    });
    
  } catch (error) {
    console.error('Error en registerFCMToken:', error);
    res.status(500).json({
      error: 'Error al registrar token',
      message: 'No se pudo registrar el token de notificaciones'
    });
  }
}

/**
 * Registro de trabajador con código de invitación
 * POST /api/auth/register-worker
 * Body: { phone, invitation_code, password }
 */
async function registerWorker(req, res) {
  try {
    const { phone, invitation_code, password } = req.body;
    
    if (!phone || !invitation_code || !password) {
      return res.status(400).json({
        error: 'Datos incompletos',
        message: 'Teléfono, código de invitación y contraseña son requeridos'
      });
    }
    
    console.log('🔍 Validando código de invitación:', invitation_code);
    console.log('📱 Para teléfono:', phone);
    
    // Buscar worker con ese código de invitación
    const { data: worker, error: workerError } = await supabase
      .from('workers')
      .select(`
        id,
        store_id,
        temp_full_name,
        temp_phone,
        position,
        registration_status,
        stores:store_id (
          id,
          name
        )
      `)
      .eq('invitation_code', invitation_code)
      .eq('registration_status', 'pending')
      .single();
    
    if (workerError || !worker) {
      console.log('❌ Código inválido o ya usado');
      return res.status(404).json({
        error: 'Código inválido',
        message: 'El código de invitación no existe o ya fue usado'
      });
    }
    
    // Verificar que el teléfono coincida
    if (worker.temp_phone !== phone) {
      console.log('❌ Teléfono no coincide');
      return res.status(400).json({
        error: 'Teléfono no coincide',
        message: 'El teléfono no corresponde a este código de invitación'
      });
    }
    
    console.log('✅ Código válido para:', worker.temp_full_name);
    
    // Detectar país desde el código de teléfono
    const countryMap = {
      '51': 'PE', '54': 'AR', '591': 'BO', '55': 'BR', '56': 'CL',
      '57': 'CO', '506': 'CR', '53': 'CU', '593': 'EC', '503': 'SV',
      '34': 'ES', '502': 'GT', '504': 'HN', '52': 'MX', '505': 'NI',
      '507': 'PA', '595': 'PY', '1809': 'DO', '598': 'UY', '58': 'VE'
    };
    
    let detectedCountry = null;
    for (const [code, country] of Object.entries(countryMap)) {
      if (phone.startsWith('+' + code) || phone.startsWith(code)) {
        detectedCountry = country;
        break;
      }
    }
    
    // Verificar que no exista otro worker activo con este teléfono en otra tienda
    const { data: existingWorkerOtherStore } = await supabase
      .from('workers')
      .select('id, store_id')
      .eq('temp_phone', phone)
      .eq('registration_status', 'completed')
      .neq('id', worker.id)
      .limit(1);
    
    if (existingWorkerOtherStore && existingWorkerOtherStore.length > 0) {
      console.log('❌ Trabajador ya registrado en otra tienda');
      return res.status(409).json({
        error: 'Ya registrado',
        message: 'Este número de teléfono ya está registrado como trabajador en otra tienda'
      });
    }
    
    // Verificar que el teléfono no esté registrado como dueño de tienda
    const { data: existingOwner } = await supabase
      .from('users')
      .select('id, role, full_name')
      .eq('phone', phone)
      .eq('role', 'owner')
      .limit(1);
    
    if (existingOwner && existingOwner.length > 0) {
      console.log('❌ Teléfono ya registrado como dueño de tienda');
      return res.status(409).json({
        error: 'Teléfono registrado como dueño',
        message: 'Este número de teléfono ya está registrado como dueño de tienda. No puedes registrarte como trabajador con este número.'
      });
    }
    
    // Generar email automático
    const email = `worker${phone}@yape.temp`;
    
    // Verificar si el email/teléfono ya existe como usuario
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .or(`email.eq.${email},phone.eq.${phone}`)
      .limit(1)
      .single();
    
    if (existingUser) {
      return res.status(409).json({
        error: 'Usuario ya existe',
        message: 'Ya existe una cuenta con este teléfono'
      });
    }
    
    // Hashear contraseña
    const password_hash = await bcrypt.hash(password, 10);
    
    // Crear usuario
    const { data: newUser, error: userError } = await supabase
      .from('users')
      .insert({
        email: email,
        password_hash,
        full_name: worker.temp_full_name,
        phone: phone,
        role: 'worker',
        country: detectedCountry
      })
      .select('id, email, full_name, phone, role, country')
      .single();
    
    if (userError) {
      console.error('❌ Error al crear usuario:', userError);
      throw userError;
    }
    
    console.log('✅ Usuario creado:', newUser.id);
    
    // Actualizar worker: asignar user_id y cambiar estado a 'completed'
    const { error: updateError } = await supabase
      .from('workers')
      .update({
        user_id: newUser.id,
        registration_status: 'completed'
      })
      .eq('id', worker.id);
    
    if (updateError) {
      console.error('❌ Error al actualizar worker:', updateError);
      throw updateError;
    }
    
    console.log('✅ Worker actualizado a completed');
    
    // Generar token JWT
    const token = generateToken(newUser);
    
    res.status(201).json({
      success: true,
      message: 'Registro completado exitosamente',
      data: {
        user: newUser,
        store: {
          id: worker.stores.id,
          name: worker.stores.name
        },
        token
      }
    });
    
  } catch (error) {
    console.error('❌ Error en registerWorker:', error);
    res.status(500).json({
      error: 'Error al registrar trabajador',
      message: 'No se pudo completar el registro. Por favor intenta nuevamente.'
    });
  }
}

/**
 * Google Sign-In - Autenticación con Google
 * POST /api/auth/google
 */
async function googleSignIn(req, res) {
  try {
    const { id_token, role = 'owner' } = req.body;
    
    if (!id_token) {
      return res.status(400).json({
        error: 'Token requerido',
        message: 'El token de Google es requerido'
      });
    }
    
    // Verificar el token de Firebase
    const admin = require('firebase-admin');
    let decodedToken;
    
    try {
      decodedToken = await admin.auth().verifyIdToken(id_token);
    } catch (firebaseError) {
      console.error('❌ Error verificando token Google:', firebaseError);
      return res.status(401).json({
        error: 'Token inválido',
        message: 'El token de Google ha expirado o es inválido'
      });
    }
    
    const { email, name, picture, uid: firebaseUid } = decodedToken;
    
    if (!email) {
      return res.status(400).json({
        error: 'Email requerido',
        message: 'No se pudo obtener el email de la cuenta de Google'
      });
    }
    
    console.log(`🔐 Google Sign-In: ${email} (${name})`);
    
    // Buscar si el usuario ya existe por email
    const { data: existingUser } = await supabase
      .from('users')
      .select('id, email, full_name, phone, phone_verified, role, country, is_active, created_at')
      .eq('email', email.toLowerCase())
      .single();
    
    if (existingUser) {
      // Usuario existe - hacer login
      if (!existingUser.is_active) {
        return res.status(403).json({
          error: 'Cuenta desactivada',
          message: 'Tu cuenta ha sido desactivada. Contacta al soporte.'
        });
      }
      
      // Verificar si tiene tienda (para owners)
      let hasStore = false;
      if (existingUser.role === 'owner') {
        const { data: store } = await supabase
          .from('stores')
          .select('id')
          .eq('owner_id', existingUser.id)
          .single();
        hasStore = !!store;
      }
      
      // Actualizar última conexión y foto si cambió
      await supabase
        .from('users')
        .update({ 
          last_login: new Date().toISOString(),
          photo_url: picture || null
        })
        .eq('id', existingUser.id);
      
      // Generar token JWT
      const token = generateToken(existingUser);
      
      console.log(`✅ Google Login exitoso: ${email}`);
      
      return res.json({
        success: true,
        message: 'Inicio de sesión exitoso',
        isNewUser: false,
        data: {
          user: {
            ...existingUser,
            photo_url: picture,
            has_store: hasStore
          },
          token
        }
      });
    }
    
    // Usuario no existe - crear cuenta nueva
    // Generar una contraseña aleatoria (no se usará porque entra con Google)
    const randomPassword = require('crypto').randomBytes(32).toString('hex');
    const password_hash = await bcrypt.hash(randomPassword, 10);
    
    // Crear usuario
    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert({
        email: email.toLowerCase(),
        password_hash,
        full_name: name || email.split('@')[0],
        role: role,
        google_uid: firebaseUid,
        photo_url: picture,
        is_active: true
      })
      .select('id, email, full_name, phone, role, country, photo_url, created_at')
      .single();
    
    if (createError) {
      console.error('❌ Error creando usuario Google:', createError);
      return res.status(500).json({
        error: 'Error al crear cuenta',
        message: 'No se pudo crear la cuenta. Intenta de nuevo.'
      });
    }
    
    // Si es owner, asignar plan Free por defecto
    // La tienda se creará manualmente en el onboarding
    if (role === 'owner') {
      const { data: freePlan } = await supabase
        .from('subscription_plans')
        .select('id')
        .eq('name', 'Free')
        .single();
      
      if (freePlan) {
        await supabase
          .from('user_subscriptions')
          .insert({
            user_id: newUser.id,
            plan_id: freePlan.id,
            status: 'active',
            started_at: new Date().toISOString()
          });
      }
    }
    
    // Generar token JWT
    const token = generateToken(newUser);
    
    console.log(`✅ Nueva cuenta Google creada: ${email}`);
    
    res.status(201).json({
      success: true,
      message: 'Cuenta creada exitosamente',
      isNewUser: true,
      data: {
        user: newUser,
        token
      }
    });
    
  } catch (error) {
    console.error('❌ Error en googleSignIn:', error);
    res.status(500).json({
      error: 'Error del servidor',
      message: 'No se pudo completar el inicio de sesión con Google'
    });
  }
}

/**
 * Solicitar recuperación de contraseña
 * POST /api/auth/forgot-password
 */
async function forgotPassword(req, res) {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({
        error: 'Email requerido',
        message: 'Debes proporcionar un email'
      });
    }
    
    // Buscar usuario
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, full_name')
      .eq('email', email.toLowerCase().trim())
      .single();
    
    // Por seguridad, siempre respondemos éxito incluso si el email no existe
    // Esto evita que alguien pueda verificar qué emails están registrados
    if (userError || !user) {
      console.log(`⚠️ Intento de recuperación para email no registrado: ${email}`);
      return res.json({
        success: true,
        message: 'Si el email existe, recibirás un código de recuperación'
      });
    }
    
    // Generar código de 6 dígitos
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Calcular fecha de expiración (15 minutos)
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    
    // Guardar código en la base de datos
    const { error: insertError } = await supabase
      .from('password_reset_codes')
      .insert({
        user_id: user.id,
        email: user.email,
        code: code,
        expires_at: expiresAt.toISOString(),
        used: false
      });
    
    if (insertError) {
      console.error('❌ Error al guardar código de recuperación:', insertError);
      return res.status(500).json({
        error: 'Error del servidor',
        message: 'No se pudo generar el código de recuperación'
      });
    }
    
    // Enviar email
    try {
      await sendPasswordResetEmail(user.email, code, user.full_name);
      console.log(`✓ Código de recuperación enviado a: ${user.email}`);
    } catch (emailError) {
      console.error('❌ Error al enviar email:', emailError);
      return res.status(500).json({
        error: 'Error al enviar email',
        message: 'No se pudo enviar el código de recuperación. Intenta nuevamente.'
      });
    }
    
    res.json({
      success: true,
      message: 'Si el email existe, recibirás un código de recuperación',
      expiresIn: 15 // minutos
    });
    
  } catch (error) {
    console.error('❌ Error en forgotPassword:', error);
    res.status(500).json({
      error: 'Error del servidor',
      message: 'No se pudo procesar la solicitud'
    });
  }
}

/**
 * Verificar código de recuperación
 * POST /api/auth/verify-reset-code
 */
async function verifyResetCode(req, res) {
  try {
    const { email, code } = req.body;
    
    if (!email || !code) {
      return res.status(400).json({
        error: 'Datos incompletos',
        message: 'Email y código son requeridos'
      });
    }
    
    // Buscar código válido
    const { data: resetCode, error: codeError } = await supabase
      .from('password_reset_codes')
      .select('*')
      .eq('email', email.toLowerCase().trim())
      .eq('code', code)
      .eq('used', false)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (codeError || !resetCode) {
      return res.status(400).json({
        error: 'Código inválido',
        message: 'El código es incorrecto o ha expirado'
      });
    }
    
    res.json({
      success: true,
      message: 'Código válido',
      resetCodeId: resetCode.id
    });
    
  } catch (error) {
    console.error('❌ Error en verifyResetCode:', error);
    res.status(500).json({
      error: 'Error del servidor',
      message: 'No se pudo verificar el código'
    });
  }
}

/**
 * Restablecer contraseña con código
 * POST /api/auth/reset-password
 */
async function resetPassword(req, res) {
  try {
    const { email, code, newPassword } = req.body;
    
    if (!email || !code || !newPassword) {
      return res.status(400).json({
        error: 'Datos incompletos',
        message: 'Email, código y nueva contraseña son requeridos'
      });
    }
    
    // Validar longitud de contraseña
    if (newPassword.length < 6) {
      return res.status(400).json({
        error: 'Contraseña inválida',
        message: 'La contraseña debe tener al menos 6 caracteres'
      });
    }
    
    // Buscar código válido
    const { data: resetCode, error: codeError } = await supabase
      .from('password_reset_codes')
      .select('*')
      .eq('email', email.toLowerCase().trim())
      .eq('code', code)
      .eq('used', false)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (codeError || !resetCode) {
      return res.status(400).json({
        error: 'Código inválido',
        message: 'El código es incorrecto o ha expirado'
      });
    }
    
    // Hash de la nueva contraseña
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Actualizar contraseña del usuario
    const { error: updateError } = await supabase
      .from('users')
      .update({ password: hashedPassword })
      .eq('id', resetCode.user_id);
    
    if (updateError) {
      console.error('❌ Error al actualizar contraseña:', updateError);
      return res.status(500).json({
        error: 'Error del servidor',
        message: 'No se pudo actualizar la contraseña'
      });
    }
    
    // Marcar código como usado
    await supabase
      .from('password_reset_codes')
      .update({ used: true })
      .eq('id', resetCode.id);
    
    console.log(`✓ Contraseña restablecida para usuario: ${resetCode.user_id}`);
    
    res.json({
      success: true,
      message: 'Contraseña actualizada correctamente'
    });
    
  } catch (error) {
    console.error('❌ Error en resetPassword:', error);
    res.status(500).json({
      error: 'Error del servidor',
      message: 'No se pudo restablecer la contraseña'
    });
  }
}

/**
 * Verificar número de teléfono (con token de Firebase)
 * POST /api/auth/verify-phone
 */
async function verifyPhone(req, res) {
  try {
    const { phone, verification_token } = req.body;
    const userId = req.user.userId;
    
    if (!phone || !verification_token) {
      return res.status(400).json({
        success: false,
        error: 'Datos incompletos',
        message: 'Se requiere el teléfono y el token de verificación'
      });
    }
    
    // Verificar el token con Firebase Admin
    const { admin } = require('../config/firebase');
    
    if (!admin) {
      console.error('❌ Firebase Admin no inicializado - verifica las variables de entorno');
      return res.status(500).json({
        success: false,
        error: 'Servicio no disponible',
        message: 'El servicio de verificación no está configurado. Contacta al administrador.'
      });
    }
    
    console.log(`🔐 Verificando token para usuario: ${userId}`);
    
    try {
      const decodedToken = await admin.auth().verifyIdToken(verification_token);
      const firebasePhone = decodedToken.phone_number;
      
      console.log(`✓ Token verificado. Teléfono de Firebase: ${firebasePhone}`);
      
      if (!firebasePhone) {
        return res.status(400).json({
          success: false,
          error: 'Token inválido',
          message: 'El token no contiene información de teléfono'
        });
      }
      
      // Verificar que el número coincida
      const cleanPhone = phone.replace(/\D/g, '');
      const firebasePhoneClean = firebasePhone.replace(/\D/g, '');
      
      if (!firebasePhoneClean.includes(cleanPhone) && !cleanPhone.includes(firebasePhoneClean.slice(-9))) {
        return res.status(400).json({
          success: false,
          error: 'Número no coincide',
          message: 'El número verificado no corresponde al registrado'
        });
      }
      
      // Actualizar usuario con teléfono verificado
      const { data: user, error } = await supabase
        .from('users')
        .update({ 
          phone: phone,
          phone_verified: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select('id, email, full_name, phone, phone_verified, role, country')
        .single();
      
      if (error) {
        console.error('Error al actualizar verificación:', error);
        throw error;
      }
      
      res.json({
        success: true,
        message: 'Teléfono verificado exitosamente',
        data: { user }
      });
      
    } catch (firebaseError) {
      console.error('Error verificando token:', firebaseError);
      return res.status(400).json({
        success: false,
        error: 'Verificación fallida',
        message: 'El token es inválido o ha expirado'
      });
    }
    
  } catch (error) {
    console.error('Error en verifyPhone:', error);
    res.status(500).json({
      success: false,
      error: 'Error del servidor',
      message: 'No se pudo verificar el teléfono'
    });
  }
}

/**
 * Crear super administrador (solo con clave secreta)
 * POST /api/auth/create-super-admin
 * Body: { email, password, full_name, secret_key }
 */
async function createSuperAdmin(req, res) {
  try {
    const { email, password, full_name, secret_key } = req.body;
    
    // Verificar clave secreta
    const SUPER_ADMIN_SECRET = process.env.SUPER_ADMIN_SECRET_KEY || 'CHANGE_THIS_SECRET_KEY_IN_PRODUCTION';
    
    if (!secret_key || secret_key !== SUPER_ADMIN_SECRET) {
      return res.status(403).json({
        error: 'Acceso denegado',
        message: 'Clave secreta inválida'
      });
    }
    
    // Validaciones básicas
    if (!email || !password || !full_name) {
      return res.status(400).json({
        error: 'Datos incompletos',
        message: 'Email, contraseña y nombre completo son requeridos'
      });
    }
    
    // Verificar si el email ya existe
    const { data: existingEmail } = await supabase
      .from('users')
      .select('id')
      .eq('email', email.toLowerCase())
      .single();
    
    if (existingEmail) {
      return res.status(409).json({
        error: 'Email ya registrado',
        message: 'Ya existe una cuenta con este email'
      });
    }
    
    // Hashear contraseña
    const password_hash = await bcrypt.hash(password, 10);
    
    // Crear super admin
    const { data: user, error } = await supabase
      .from('users')
      .insert({
        email: email.toLowerCase(),
        password_hash,
        full_name,
        role: 'super_admin',
        phone: null
      })
      .select('id, email, full_name, role, created_at')
      .single();
    
    if (error) {
      console.error('Error al crear super admin:', error);
      throw error;
    }
    
    console.log(`✅ Super admin creado: ${user.email}`);
    
    res.status(201).json({
      success: true,
      message: 'Super administrador creado exitosamente',
      data: {
        user: {
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          role: user.role,
          created_at: user.created_at
        }
      }
    });
    
  } catch (error) {
    console.error('Error en createSuperAdmin:', error);
    res.status(500).json({
      error: 'Error al crear super administrador',
      message: 'Hubo un problema al crear la cuenta'
    });
  }
}

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  registerFCMToken,
  registerWorker,
  googleSignIn,
  forgotPassword,
  verifyResetCode,
  resetPassword,
  verifyPhone,
  createSuperAdmin,
  sendEmailVerification,
  verifyEmailCode
};

/**
 * Enviar código de verificación de email
 * POST /api/auth/send-email-verification
 */
async function sendEmailVerification(req, res) {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({
        error: 'Email requerido',
        message: 'Debes proporcionar un email'
      });
    }
    
    const cleanEmail = email.toLowerCase().trim();
    
    // Verificar si el email ya está registrado
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', cleanEmail)
      .single();
    
    if (existingUser) {
      return res.status(400).json({
        error: 'Email registrado',
        message: 'Este email ya está registrado. Intenta iniciar sesión.'
      });
    }
    
    // Generar código de 6 dígitos
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Calcular fecha de expiración (10 minutos)
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    
    // Eliminar códigos previos para este email
    await supabase
      .from('email_verification_codes')
      .delete()
      .eq('email', cleanEmail);
    
    // Guardar nuevo código
    const { error: insertError } = await supabase
      .from('email_verification_codes')
      .insert({
        email: cleanEmail,
        code: code,
        expires_at: expiresAt.toISOString(),
        verified: false
      });
    
    if (insertError) {
      console.error('❌ Error al guardar código de verificación:', insertError);
      return res.status(500).json({
        error: 'Error del servidor',
        message: 'No se pudo generar el código de verificación'
      });
    }
    
    // Enviar email
    try {
      await sendEmailVerificationCode(cleanEmail, code);
      console.log(`✓ Código de verificación enviado a: ${cleanEmail}`);
    } catch (emailError) {
      console.error('❌ Error al enviar email:', emailError);
      return res.status(500).json({
        error: 'Error al enviar email',
        message: 'No se pudo enviar el código de verificación. Verifica que el email sea correcto.'
      });
    }
    
    res.json({
      success: true,
      message: 'Código de verificación enviado',
      expiresIn: 10 // minutos
    });
    
  } catch (error) {
    console.error('❌ Error en sendEmailVerification:', error);
    res.status(500).json({
      error: 'Error del servidor',
      message: 'No se pudo procesar la solicitud'
    });
  }
}

/**
 * Verificar código de email
 * POST /api/auth/verify-email-code
 */
async function verifyEmailCode(req, res) {
  try {
    const { email, code } = req.body;
    
    if (!email || !code) {
      return res.status(400).json({
        error: 'Datos incompletos',
        message: 'Email y código son requeridos'
      });
    }
    
    const cleanEmail = email.toLowerCase().trim();
    
    // Buscar código válido
    const { data: verification, error: verifyError } = await supabase
      .from('email_verification_codes')
      .select('*')
      .eq('email', cleanEmail)
      .eq('code', code)
      .eq('verified', false)
      .gt('expires_at', new Date().toISOString())
      .single();
    
    if (verifyError || !verification) {
      return res.status(400).json({
        error: 'Código inválido',
        message: 'El código es incorrecto o ha expirado'
      });
    }
    
    // Marcar como verificado
    await supabase
      .from('email_verification_codes')
      .update({ verified: true })
      .eq('id', verification.id);
    
    // Generar token de verificación (válido por 30 minutos para completar registro)
    const verificationToken = jwt.sign(
      { email: cleanEmail, type: 'email_verification' },
      process.env.JWT_SECRET,
      { expiresIn: '30m' }
    );
    
    res.json({
      success: true,
      verified: true,
      message: 'Email verificado correctamente',
      token: verificationToken
    });
    
  } catch (error) {
    console.error('❌ Error en verifyEmailCode:', error);
    res.status(500).json({
      error: 'Error del servidor',
      message: 'No se pudo verificar el código'
    });
  }
}
