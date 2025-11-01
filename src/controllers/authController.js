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
    const { email, password, full_name, phone, role = 'worker' } = req.body;
    
    // Validaciones básicas (el middleware de validación ya hace la mayoría)
    if (!email || !password || !full_name) {
      return res.status(400).json({
        error: 'Datos incompletos',
        message: 'Email, contraseña y nombre completo son requeridos'
      });
    }
    
    // Verificar si el email ya existe
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('email', email.toLowerCase())
      .single();
    
    if (existing) {
      return res.status(409).json({
        error: 'Email ya registrado',
        message: 'Ya existe una cuenta con este email'
      });
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
        phone,
        role
      })
      .select('id, email, full_name, phone, role, created_at')
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
 */
async function login(req, res) {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        error: 'Datos incompletos',
        message: 'Email y contraseña son requeridos'
      });
    }
    
    // Buscar usuario por email
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, password_hash, full_name, phone, role, is_active')
      .eq('email', email.toLowerCase())
      .single();
    
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
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    
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
    
    res.json({
      success: true,
      data: { user }
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

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  registerFCMToken
};
