// src/routes/stores.js
const express = require('express');
const router = express.Router();
const storeController = require('../controllers/storeController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { storeValidation, validateUUID } = require('../middleware/validation');

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// Obtener todas las tiendas del usuario
router.get('/', storeController.getStores);

// Obtener una tienda específica
router.get('/:id', validateUUID('id'), storeController.getStoreById);

// Crear nueva tienda (solo owner y super_admin)
router.post(
  '/',
  authorizeRoles('owner', 'super_admin'),
  storeValidation.create,
  storeController.createStore
);

// Actualizar tienda (solo owner y super_admin)
router.put(
  '/:id',
  validateUUID('id'),
  authorizeRoles('owner', 'super_admin'),
  storeValidation.update,
  storeController.updateStore
);

// Eliminar tienda (solo owner y super_admin)
router.delete(
  '/:id',
  validateUUID('id'),
  authorizeRoles('owner', 'super_admin'),
  storeController.deleteStore
);

// Obtener estadísticas de una tienda
router.get('/:id/stats', validateUUID('id'), storeController.getStoreStats);

module.exports = router;
