const pool = require('../config/db');

class TaskModel {
  // Asegura que la tabla de tareas exista en la base de datos
  static async initTable() {
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS tasks (
          id INT AUTO_INCREMENT PRIMARY KEY,
          title VARCHAR(255) NOT NULL,
          description TEXT,
          completed BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('Tabla "tasks" inicializada correctamente.');
    } catch (error) {
      console.error('Error al inicializar la tabla "tasks":', error.message);
    }
  }

  static async createTask({ title, description }) {
    try {
      const [result] = await pool.query(
        'INSERT INTO tasks (title, description) VALUES (?, ?)',
        [title, description]
      );
      return { id: result.insertId, title, description, completed: false };
    } catch (error) {
      throw new Error(`Error al crear la tarea: ${error.message}`);
    }
  }

  static async getAllTasks() {
    try {
      const [rows] = await pool.query('SELECT * FROM tasks ORDER BY created_at DESC');
      return rows;
    } catch (error) {
      throw new Error(`Error al obtener las tareas: ${error.message}`);
    }
  }

  static async updateTaskStatus(id, completed) {
    try {
      await pool.query(
        'UPDATE tasks SET completed = ? WHERE id = ?',
        [completed, id]
      );
      return { id, completed };
    } catch (error) {
      throw new Error(`Error al actualizar el estado de la tarea: ${error.message}`);
    }
  }

  static async deleteTask(id) {
    try {
      await pool.query('DELETE FROM tasks WHERE id = ?', [id]);
      return { id };
    } catch (error) {
      throw new Error(`Error al eliminar la tarea: ${error.message}`);
    }
  }
}

// Ejecutar inicialización de la tabla
TaskModel.initTable();

module.exports = TaskModel;
