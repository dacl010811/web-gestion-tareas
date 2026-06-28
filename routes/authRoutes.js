/**
 * routes/authRoutes.js
 * Capa de Rutas — Enrutamiento de peticiones de autenticación.
 * Todas las rutas de auth son públicas (no requieren sesión).
 */
const express      = require('express');
const router       = express.Router();
const authController = require('../controllers/authController');

// POST /api/auth/register — Registro de nuevo usuario
router.post('/register', authController.register);

// POST /api/auth/login — Inicio de sesión
router.post('/login', authController.login);

// POST /api/auth/logout — Cierre de sesión
router.post('/logout', authController.logout);

// GET /api/auth/me — Verificar sesión activa
router.get('/me', authController.me);

module.exports = router;
