require('dotenv').config();
const express       = require('express');
const session       = require('express-session');
const runSeed       = require('./db/seed');

const app  = express();
const PORT = process.env.PORT || 3000;

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Decisión de diseño: express-session con almacenamiento en memoria (MemoryStore).
// Para producción se recomienda usar connect-mysql-session o similar.
app.use(session({
  secret:            process.env.SESSION_SECRET || 'cambiar_en_produccion',
  resave:            false,
  saveUninitialized: false,
  cookie: {
    secure:   false,      // true en producción con HTTPS
    httpOnly: true,
    maxAge:   1000 * 60 * 60 * 8  // 8 horas
  }
}));

// ─── Rutas de la API ──────────────────────────────────────────────────────────
const authRoutes = require('./routes/authRoutes');
const taskRoutes = require('./routes/taskRoutes');

app.use('/api/auth',  authRoutes);
app.use('/api/tasks', taskRoutes);

// ─── Ruta Principal — SPA ─────────────────────────────────────────────────────
app.get('*', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

// ─── Manejo de Errores ────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Error interno del servidor.' });
});

// ─── Inicialización ───────────────────────────────────────────────────────────
// Ejecutar seed de BD y luego iniciar el servidor
runSeed().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Servidor ejecutándose en http://localhost:${PORT}`);
  });
});