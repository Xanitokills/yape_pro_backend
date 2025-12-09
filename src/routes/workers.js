// src/routes/workers.js
const express = require('express');
const router = express.Router();
const workerController = require('../controllers/workerController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { workerValidation, validateUUID } = require('../middleware/validation');
const { checkEmployeeLimit } = require('../middleware/planLimits');

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// Obtener trabajadores de una tienda (query: ?store_id=xxx)
router.get('/', workerController.getWorkers);

// Buscar usuarios para agregar como trabajadores (query: ?email=xxx o ?full_name=xxx)
router.get('/search', workerController.searchUsers);

// Agregar trabajador a una tienda (solo owner y super_admin)
router.post(
  '/',
  authorizeRoles('owner', 'super_admin'),
  checkEmployeeLimit, // Verificar límite del plan
  workerValidation.add,
  workerController.addWorker
);

// Actualizar información de trabajador (solo owner y super_admin)
router.put(
  '/:id',
  validateUUID('id'),
  authorizeRoles('owner', 'super_admin'),
  workerController.updateWorker
);

// Eliminar trabajador (solo owner y super_admin)
router.delete(
  '/:id',
  validateUUID('id'),
  authorizeRoles('owner', 'super_admin'),
  workerController.removeWorker
);

module.exports = router;
