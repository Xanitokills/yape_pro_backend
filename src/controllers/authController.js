// src/controllers/authController.js
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { supabase } = require('../config/database');

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
    const { email, password, full_name, phone, role = 'worker', verification_token } = req.body;
    
    // Validaciones básicas (el middleware de validación ya hace la mayoría)
    if (!email || !password || !full_name) {
      return res.status(400).json({
        error: 'Datos incompletos',
        message: 'Email, contraseña y nombre completo son requeridos'
      });
    }
    
    // Para owners, el teléfono es OBLIGATORIO (evita múltiples cuentas free)
    if (role === 'owner' && !phone) {
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
      '58': 'VE'     // Venezuela
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
    let query = supabase
      .from('users')
      .select('id, email, password_hash, full_name, phone, role, is_active');
    
    if (email) {
      query = query.eq('email', email.toLowerCase());
    } else {
      query = query.eq('phone', phone);
    }
    
    const { data: user, error } = await query.single();
    
    if (error || !user) {
      return res.status(401).json({
        error: 'Credenciales inválidas',
        message: 'Email o contraseña incorrectos'
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
          role: user.role
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
      .select('id, email, full_name, phone, role, is_active, created_at, last_login')
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
    const { full_name, phone } = req.body;
    const userId = req.user.userId;
    
    // Preparar campos a actualizar
    const updates = {
      updated_at: new Date().toISOString()
    };
    
    if (full_name) updates.full_name = full_name;
    if (phone !== undefined) updates.phone = phone;
    
    // Actualizar en la base de datos
    const { data: user, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select('id, email, full_name, phone, role, updated_at')
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

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  registerFCMToken,
  registerWorker
};
