/**
 * Rutas de Setup - Solo para configuración inicial
 * ELIMINAR DESPUÉS DE CONFIGURAR EL SUPER ADMIN
 */

const express = require('express');
const router = express.Router();
const { supabase } = require('../config/database');

/**
 * @route   POST /api/setup/create-super-admin
 * @desc    Crear cuenta de super admin
 * @body    { email, password, fullName }
 * @access  Public (ELIMINAR DESPUÉS DE USAR)
 */
router.post('/create-super-admin', async (req, res) => {
  try {
    const { email, password, fullName } = req.body;

    if (!email || !password || !fullName) {
      return res.status(400).json({
        success: false,
        message: 'Email, password y fullName son requeridos'
      });
    }

    // 1. Verificar si el usuario ya existe en auth.users
    const { data: existingAuthUser, error: checkAuthError } = await supabase.auth.admin.listUsers();
    
    if (checkAuthError) {
      console.error('Error al verificar usuarios:', checkAuthError);
    }

    const authUserExists = existingAuthUser?.users?.some(u => u.email === email);

    let userId;

    if (authUserExists) {
      // Usuario existe en auth, obtener su ID
      const authUser = existingAuthUser.users.find(u => u.email === email);
      userId = authUser.id;
      console.log('Usuario ya existe en auth.users:', userId);
    } else {
      // 2. Crear usuario en auth.users
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          full_name: fullName
        }
      });

      if (authError) {
        console.error('Error al crear usuario en auth:', authError);
        return res.status(500).json({
          success: false,
          message: 'Error al crear usuario en autenticación',
          error: authError.message
        });
      }

      userId = authData.user.id;
      console.log('Usuario creado en auth.users:', userId);
    }

    // 3. Verificar si existe en tabla users
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (existingUser) {
      // Usuario existe, solo actualizar rol
      const { error: updateError } = await supabase
        .from('users')
        .update({
          role: 'super_admin',
          subscription_plan_id: 'enterprise',
          subscription_status: 'active',
          subscription_started_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('email', email);

      if (updateError) {
        console.error('Error al actualizar usuario:', updateError);
        return res.status(500).json({
          success: false,
          message: 'Error al actualizar usuario',
          error: updateError.message
        });
      }

      return res.json({
        success: true,
        message: 'Super Admin actualizado exitosamente',
        data: {
          email,
          role: 'super_admin',
          existing: true
        }
      });
    }

    // 4. Crear en tabla users
    const { data: userData, error: userError } = await supabase
      .from('users')
      .insert({
        id: userId,
        email,
        password_hash: 'supabase_auth', // Placeholder porque la auth real está en auth.users
        full_name: fullName,
        role: 'super_admin',
        subscription_plan_id: 'enterprise',
        subscription_status: 'active',
        subscription_started_at: new Date().toISOString(),
        is_active: true
      })
      .select()
      .single();

    if (userError) {
      console.error('Error al crear usuario en tabla users:', userError);
      return res.status(500).json({
        success: false,
        message: 'Error al crear usuario en base de datos',
        error: userError.message
      });
    }

    res.json({
      success: true,
      message: 'Super Admin creado exitosamente',
      data: {
        id: userData.id,
        email: userData.email,
        fullName: userData.full_name,
        role: userData.role,
        plan: userData.subscription_plan_id
      }
    });

  } catch (error) {
    console.error('Error al crear super admin:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/setup/promote-to-admin
 * @desc    Convertir usuario existente a super admin
 * @body    { email }
 * @access  Public (ELIMINAR DESPUÉS DE USAR)
 */
router.post('/promote-to-admin', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email es requerido'
      });
    }

    // Actualizar usuario existente
    const { data, error } = await supabase
      .from('users')
      .update({
        role: 'super_admin',
        subscription_plan_id: 'enterprise',
        subscription_status: 'active',
        subscription_started_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('email', email)
      .select()
      .single();

    if (error) {
      console.error('Error al promover usuario:', error);
      return res.status(500).json({
        success: false,
        message: 'Error al promover usuario. ¿El usuario existe?',
        error: error.message
      });
    }

    res.json({
      success: true,
      message: 'Usuario promovido a Super Admin exitosamente',
      data: {
        email: data.email,
        role: data.role,
        plan: data.subscription_plan_id
      }
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

module.exports = router;
