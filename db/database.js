/**
 * db/database.js
 * Capa de Datos — Pool de conexión a MySQL usando mysql2/promise.
 * Decisión de diseño: Se usa un pool de conexiones para reutilizar
 * conexiones y evitar el overhead de abrir/cerrar una nueva en cada petición.
 */
require('dotenv').config();
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host:     process.env.DB_HOST     || '127.0.0.1',
  user:     process.env.DB_USER     || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME     || 'personal_web',
  port:     process.env.DB_PORT     || 3306,
  waitForConnections: true,
  connectionLimit:    10,
  queueLimit:         0,
});

module.exports = pool;
