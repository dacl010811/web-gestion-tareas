/**
 * routes/taskRoutes.js
 * Capa de Rutas — Enrutamiento de peticiones CRUD de tareas.
 * Decisión de diseño: Todas las rutas están protegidas por el middleware
 * requireAuth que verifica que el usuario tenga una sesión activa.
 */
const express          = require('express');
const router           = express.Router();
const taskController   = require('../controllers/taskController');

/**
 * Middleware de autenticación.
 * Si el usuario no tiene sesión activa, retorna 401 Unauthorized.
 */
const requireAuth = (req, res, next) => {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ success: false, message: 'Acceso denegado. Debes iniciar sesión.' });
  }
  next();
};

// Aplicar requireAuth a todas las rutas de este router
router.use(requireAuth);

// GET    /api/tasks       — Listar tareas del usuario
router.get('/',    taskController.getTasks);

// POST   /api/tasks       — Crear nueva tarea
router.post('/',   taskController.createTask);

// PATCH  /api/tasks/:id   — Actualizar estado completado
router.patch('/:id', taskController.updateTaskStatus);

// DELETE /api/tasks/:id   — Eliminar tarea
router.delete('/:id', taskController.deleteTask);

module.exports = router;
