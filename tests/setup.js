require('dotenv').config();
const pool = require('../db/database');

// Configurar variables de entorno para testing
process.env.SESSION_SECRET = 'test-secret-key';

// Limpiar la base de datos antes de cada test
beforeEach(async () => {
  const conn = await pool.getConnection();
  try {
    // Desactivar foreign key checks temporalmente
    await conn.query('SET FOREIGN_KEY_CHECKS = 0');
    // Truncar tablas
    await conn.query('TRUNCATE TABLE tasks');
    await conn.query('TRUNCATE TABLE users');
    // Reactivar foreign key checks
    await conn.query('SET FOREIGN_KEY_CHECKS = 1');
  } finally {
    conn.release();
  }
});

// Cerrar el pool de conexiones después de todos los tests
afterAll(async () => {
  await pool.end();
});
