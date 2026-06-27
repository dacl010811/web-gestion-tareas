const express = require('express');
const router = express.Router();
const TaskController = require('../controllers/TaskController');

// Obtener todas las tareas
router.get('/', TaskController.getTasks);

// Crear nueva tarea
router.post('/', TaskController.createTask);

// Actualizar estado de una tarea (completado/pendiente)
router.patch('/:id', TaskController.updateTaskStatus);

// Eliminar una tarea
router.delete('/:id', TaskController.deleteTask);

module.exports = router;
