const TaskModel = require('../models/TaskModel');

class TaskController {
  static async getTasks(req, res) {
    try {
      const tasks = await TaskModel.getAllTasks();
      res.status(200).json({
        success: true,
        data: tasks
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  static async createTask(req, res) {
    try {
      const { title, description } = req.body || {};

      // Validación
      if (!title || !title.trim()) {
        return res.status(400).json({
          success: false,
          message: 'El título de la tarea es obligatorio.'
        });
      }

      const task = await TaskModel.createTask({
        title: title.trim(),
        description: (description || '').trim()
      });

      res.status(201).json({
        success: true,
        message: 'Tarea creada correctamente',
        data: task
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  static async updateTaskStatus(req, res) {
    try {
      const { id } = req.params;
      const { completed } = req.body;

      if (completed === undefined) {
        return res.status(400).json({
          success: false,
          message: 'El campo "completed" es obligatorio para actualizar.'
        });
      }

      // Convertir a booleano/entero
      const isCompleted = !!completed;

      const result = await TaskModel.updateTaskStatus(id, isCompleted);
      res.status(200).json({
        success: true,
        message: 'Estado de tarea actualizado correctamente',
        data: result
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  static async deleteTask(req, res) {
    try {
      const { id } = req.params;
      await TaskModel.deleteTask(id);
      res.status(200).json({
        success: true,
        message: 'Tarea eliminada correctamente'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
}

module.exports = TaskController;
