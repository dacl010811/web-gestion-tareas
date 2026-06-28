/**
 * controllers/authController.js
 * Controlador de Autenticación — Capa de Controlador (MVC).
 * Maneja registro, login y logout de usuarios.
 * Decisión de diseño: Contraseñas hasheadas con bcryptjs (salt rounds: 10).
 * Las sesiones se gestionan con express-session en server.js.
 */
const bcrypt = require('bcryptjs');
const pool   = require('../db/database');

const SALT_ROUNDS = 10;

/**
 * POST /api/auth/register
 * Registra un nuevo usuario.
 */
const register = async (req, res) => {
  const { username, email, password } = req.body;

  // Validación de campos obligatorios
  if (!username || !email || !password) {
    return res.status(400).json({ success: false, message: 'Todos los campos son obligatorios.' });
  }
  if (password.length < 6) {
    return res.status(400).json({ success: false, message: 'La contraseña debe tener al menos 6 caracteres.' });
  }
  // Validación formato de correo
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ success: false, message: 'El formato del correo electrónico no es válido.' });
  }

  try {
    // Verificar si el usuario ya existe
    const [existing] = await pool.query(
      'SELECT id FROM users WHERE email = ? OR username = ?',
      [email, username]
    );
    if (existing.length > 0) {
      return res.status(409).json({ success: false, message: 'El correo o nombre de usuario ya está en uso.' });
    }

    // Hashear contraseña e insertar
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const [result] = await pool.query(
      'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
      [username.trim(), email.trim().toLowerCase(), passwordHash]
    );

    // Crear sesión automáticamente después del registro
    req.session.userId   = result.insertId;
    req.session.username = username.trim();

    return res.status(201).json({
      success: true,
      message: '¡Registro exitoso! Bienvenido.',
      user: { id: result.insertId, username: username.trim(), email: email.trim().toLowerCase() }
    });
  } catch (err) {
    console.error('Error en register:', err);
    return res.status(500).json({ success: false, message: 'Error interno del servidor.' });
  }
};

/**
 * POST /api/auth/login
 * Inicia sesión con email y contraseña.
 */
const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Correo y contraseña son obligatorios.' });
  }

  try {
    const [rows] = await pool.query(
      'SELECT id, username, email, password_hash FROM users WHERE email = ?',
      [email.trim().toLowerCase()]
    );

    if (rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Credenciales incorrectas.' });
    }

    const user = rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Credenciales incorrectas.' });
    }

    // Crear sesión
    req.session.userId   = user.id;
    req.session.username = user.username;

    return res.json({
      success: true,
      message: '¡Inicio de sesión exitoso!',
      user: { id: user.id, username: user.username, email: user.email }
    });
  } catch (err) {
    console.error('Error en login:', err);
    return res.status(500).json({ success: false, message: 'Error interno del servidor.' });
  }
};

/**
 * POST /api/auth/logout
 * Cierra la sesión del usuario actual.
 */
const logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'No se pudo cerrar la sesión.' });
    }
    res.clearCookie('connect.sid');
    return res.json({ success: true, message: 'Sesión cerrada correctamente.' });
  });
};

/**
 * GET /api/auth/me
 * Retorna los datos del usuario autenticado (para verificar sesión activa).
 */
const me = (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ success: false, message: 'No hay sesión activa.' });
  }
  return res.json({
    success: true,
    user: { id: req.session.userId, username: req.session.username }
  });
};

module.exports = { register, login, logout, me };
