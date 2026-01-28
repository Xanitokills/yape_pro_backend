const express = require('express');
const router = express.Router();
const { supabase } = require('../config/database');
const { contactLimiter } = require('../middleware/rateLimiter');

/**
 * POST /api/contact-sales
 * Endpoint para recibir solicitudes de contacto del plan empresarial
 */
router.post('/contact-sales', contactLimiter, async (req, res) => {
  try {
    const {
      companyName,
      fullName,
      email,
      phone,
      position,
      employees,
      stores,
      city,
      message
    } = req.body;

    // Validaciones básicas
    if (!companyName || !fullName || !email || !phone || !position || !employees || !stores || !city) {
      return res.status(400).json({
        success: false,
        error: 'Todos los campos obligatorios deben ser completados'
      });
    }

    // Guardar en la base de datos
    const { data, error } = await supabase
      .from('contact_requests')
      .insert([
        {
          company_name: companyName,
          full_name: fullName,
          email: email,
          phone: phone,
          position: position,
          employees: employees,
          stores: stores,
          city: city,
          message: message || null,
          status: 'pending'
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Error guardando solicitud en BD:', error);
      throw error;
    }

    console.log('✅ Solicitud guardada con ID:', data.id);
    console.log('📧 Nueva solicitud de contacto empresarial:', {
      id: data.id,
      companyName,
      fullName,
      email,
      phone,
      employees,
      stores
    });

    // TODO: Aquí puedes agregar:
    // 1. Enviar email al equipo de ventas
    // 2. Enviar email de confirmación al cliente
    // 3. Notificar en Slack/Discord
    // 4. Integrar con CRM (HubSpot, Salesforce, etc.)

    res.json({
      success: true,
      message: 'Solicitud recibida correctamente. Nos pondremos en contacto pronto.',
      requestId: data.id
    });

  } catch (error) {
    console.error('Error procesando solicitud de contacto:', error);
    res.status(500).json({
      success: false,
      error: 'Error al procesar la solicitud'
    });
  }
});

module.exports = router;
