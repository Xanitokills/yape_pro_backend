// src/middleware/auth.js
const jwt = require('jsonwebtoken');
const { supabase } = require('../config/database');

/**
 * Middleware para verificar JWT
 */
async function authenticateToken(req, res, next) {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
    
    if (!token) {
      return res.status(401).json({
        error: 'No autorizado',
        message: 'Token no proporcionado. Incluye el header: Authorization: Bearer TOKEN'
      });
    }
    
    // Verificar token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Verificar que el usuario existe y está activo
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, role, is_active, full_name')
      .eq('id', decoded.userId)
      .single();
    
    if (error || !user) {
      return res.status(403).json({
        error: 'Usuario no encontrado'
      });
    }
    
    if (!user.is_active) {
      return res.status(403).json({
        error: 'Usuario inactivo',
        message: 'Tu cuenta ha sido desactivada. Contacta al administrador.'
      });
    }
    
    // Agregar usuario al request
    req.user = {
      userId: user.id,
      email: user.email,
      role: user.role,
      fullName: user.full_name
    };
    
    next();
    
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(403).json({
        error: 'Token expirado',
        message: 'Tu sesión ha expirado. Por favor inicia sesión nuevamente.'
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(403).json({
        error: 'Token inválido',
        message: 'El token proporcionado no es válido.'
      });
    }
    
    console.error('Error en authenticateToken:', error);
    res.status(500).json({
      error: 'Error al verificar autenticación'
    });
  }
}

/**
 * Middleware para verificar roles específicos
 * Uso: authorizeRoles('owner', 'super_admin')
 */
function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'No autorizado',
        message: 'Debes estar autenticado para acceder a este recurso'
      });
    }
    
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Acceso denegado',
        message: `Esta acción requiere uno de los siguientes roles: ${allowedRoles.join(', ')}`,
        yourRole: req.user.role
      });
    }
    
    next();
  };
}

/**
 * Middleware opcional: continúa si hay token, pero no falla si no hay
 */
async function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
      req.user = null;
      return next();
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const { data: user } = await supabase
      .from('users')
      .select('id, email, role, is_active')
      .eq('id', decoded.userId)
      .single();
    
    if (user && user.is_active) {
      req.user = {
        userId: user.id,
        email: user.email,
        role: user.role
      };
    }
    
    next();
    
  } catch (error) {
    req.user = null;
    next();
  }
}

module.exports = {
  authenticateToken,
  authorizeRoles,
  optionalAuth
};
