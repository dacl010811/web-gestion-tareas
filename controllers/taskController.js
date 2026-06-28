/**
 * controllers/taskController.js
 * Controlador de Tareas — Capa de Controlador (MVC).
 * Implementa las operaciones CRUD para la entidad Task.
 * Decisión de diseño: Todas las operaciones están filtradas por user_id de la sesión,
 * garantizando que cada usuario solo accede a sus propias tareas (aislamiento de datos).
 */
const pool = require('../db/database');

/**
 * GET /api/tasks
 * Obtiene todas las tareas del usuario autenticado, ordenadas por fecha de creación.
 */
const getTasks = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, title, description, completed, created_at FROM tasks WHERE user_id = ? ORDER BY created_at DESC',
      [req.session.userId]
    );
    return res.json({ success: true, data: rows });
  } catch (err) {
    console.error('Error en getTasks:', err);
    return res.status(500).json({ success: false, message: 'Error al obtener las tareas.' });
  }
};

/**
 * POST /api/tasks
 * Crea una nueva tarea asociada al usuario autenticado.
 */
const createTask = async (req, res) => {
  const { title, description } = req.body;

  if (!title || title.trim() === '') {
    return res.status(400).json({ success: false, message: 'El título de la tarea es obligatorio.' });
  }

  try {
    const [result] = await pool.query(
      'INSERT INTO tasks (user_id, title, description) VALUES (?, ?, ?)',
      [req.session.userId, title.trim(), description ? description.trim() : null]
    );
    return res.status(201).json({
      success: true,
      message: 'Tarea creada exitosamente.',
      data: {
        id:          result.insertId,
        title:       title.trim(),
        description: description ? description.trim() : null,
        completed:   0
      }
    });
  } catch (err) {
    console.error('Error en createTask:', err);
    return res.status(500).json({ success: false, message: 'Error al crear la tarea.' });
  }
};

/**
 * PATCH /api/tasks/:id
 * Actualiza el estado de completado de una tarea.
 * Verifica que la tarea pertenezca al usuario autenticado.
 */
const updateTaskStatus = async (req, res) => {
  const taskId    = parseInt(req.params.id, 10);
  const { completed } = req.body;

  if (isNaN(taskId)) {
    return res.status(400).json({ success: false, message: 'ID de tarea inválido.' });
  }
  if (completed === undefined || completed === null) {
    return res.status(400).json({ success: false, message: 'El campo "completed" es obligatorio.' });
  }

  try {
    const [result] = await pool.query(
      'UPDATE tasks SET completed = ? WHERE id = ? AND user_id = ?',
      [completed ? 1 : 0, taskId, req.session.userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Tarea no encontrada o sin permisos.' });
    }

    return res.json({ success: true, message: 'Estado de la tarea actualizado.' });
  } catch (err) {
    console.error('Error en updateTaskStatus:', err);
    return res.status(500).json({ success: false, message: 'Error al actualizar la tarea.' });
  }
};

/**
 * DELETE /api/tasks/:id
 * Elimina una tarea. Verifica que pertenezca al usuario autenticado.
 */
const deleteTask = async (req, res) => {
  const taskId = parseInt(req.params.id, 10);

  if (isNaN(taskId)) {
    return res.status(400).json({ success: false, message: 'ID de tarea inválido.' });
  }

  try {
    const [result] = await pool.query(
      'DELETE FROM tasks WHERE id = ? AND user_id = ?',
      [taskId, req.session.userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Tarea no encontrada o sin permisos.' });
    }

    return res.json({ success: true, message: 'Tarea eliminada correctamente.' });
  } catch (err) {
    console.error('Error en deleteTask:', err);
    return res.status(500).json({ success: false, message: 'Error al eliminar la tarea.' });
  }
};

module.exports = { getTasks, createTask, updateTaskStatus, deleteTask };
