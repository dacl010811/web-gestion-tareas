/**
 * db/seed.js
 * Inicialización del esquema de base de datos.
 * Decisión de diseño: Las tablas se crean con IF NOT EXISTS para que este
 * script sea idempotente — se puede ejecutar múltiples veces sin romper datos existentes.
 * Se llama automáticamente desde server.js al arrancar.
 */
const pool = require('./database');

const createUsersTable = `
  CREATE TABLE IF NOT EXISTS users (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    username     VARCHAR(50)  NOT NULL UNIQUE,
    email        VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at   DATETIME DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
`;

const createTasksTable = `
  CREATE TABLE IF NOT EXISTS tasks (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    user_id     INT         NOT NULL,
    title       VARCHAR(255) NOT NULL,
    description TEXT,
    completed   TINYINT(1)  NOT NULL DEFAULT 0,
    created_at  DATETIME    DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_task_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
`;

async function runSeed() {
  try {
    const conn = await pool.getConnection();
    await conn.query(createUsersTable);
    await conn.query(createTasksTable);
    conn.release();
    console.log('✅ Base de datos inicializada correctamente (tablas: users, tasks).');
  } catch (err) {
    console.error('❌ Error al inicializar la base de datos:', err.message);
    // No se lanza el error para no bloquear el arranque si la BD no está disponible aún
  }
}

module.exports = runSeed;
