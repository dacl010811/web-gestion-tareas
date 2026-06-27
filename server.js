require('dotenv').config();
const express = require('express');
const db = require('./src/config/db');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Rutas
const taskRoutes = require('./src/routes/TaskRoute');
app.use('/api/tasks', taskRoutes);

// Ruta principal
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

// Manejo de errores 404
app.use((req, res) => {
  res.status(404).send('Página no encontrada');
});

// Manejo de errores generales
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Algo salió mal!');
});

app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
});