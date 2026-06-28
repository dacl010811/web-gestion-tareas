# Skill: Generación de Aplicaciones Web MVC con Node.js

## Descripción
Genera aplicaciones web completas con arquitectura **MVC de 3 capas** (Modelo-Vista-Controlador) utilizando **Node.js, Express.js, MySQL y JavaScript vanilla**. Incluye autenticación de usuarios, operaciones CRUD, API RESTful y containerización Docker lista para producción.

---

## Cuándo Usar Este Skill

✅ El usuario necesita crear una **aplicación web desde cero**  
✅ Se requiere **autenticación de usuarios** + gestión de datos  
✅ Se pide arquitectura **MVC con stack JavaScript**  
✅ Se necesita un **prototipo rápido** pero con buenas prácticas  
✅ El proyecto requiere **containerización Docker**  

❌ NO usar para: APIs sin frontend, microservicios, aplicaciones React/Vue/Angular, proyectos serverless

---

## Stack Tecnológico Base

| Capa | Tecnología | Versión Mínima | Propósito |
|---|---|---|---|
| **Modelo** | MySQL 8 + mysql2/promise | 8.0+ | Persistencia de datos relacional |
| **Controlador** | Node.js + Express.js | 18+ / 4.18+ | Lógica de negocio y routing |
| **Vista** | HTML5 + CSS3 + JavaScript vanilla | ES6+ | Interfaz SPA sin frameworks |
| **Seguridad** | bcryptjs + express-session | 2.4+ / 1.17+ | Hash passwords y sesiones |
| **DevOps** | Docker + docker-compose | 20+ / 2.20+ | Containerización |

---

## Pasos de Ejecución

### Paso 1: Definir Alcance del Proyecto

**Preguntas clave al usuario:**
1. ¿Cuál es la **entidad principal** del sistema? (ej: tareas, productos, clientes, inventario)
2. ¿Qué **operaciones CRUD** necesita? (crear, listar, actualizar, eliminar)
3. ¿Requiere **autenticación multi-usuario**? (sí/no)
4. ¿Los datos deben estar **aislados por usuario**? (sí/no)
5. ¿Necesita **campos específicos** adicionales? (describirlos)

**Output esperado:**
- Nombre del proyecto y directorio
- Lista de entidades con sus campos
- Diagrama mental de relaciones

---

### Paso 2: Configurar Estructura del Proyecto

**Crear la siguiente estructura de carpetas:**

```
nombre-proyecto/
├── controllers/
│   ├── authController.js          ← Registro, login, logout, sesión
│   └── [entity]Controller.js      ← CRUD de la entidad principal
├── db/
│   ├── database.js                ← Pool de conexiones MySQL
│   └── seed.js                    ← Creación de tablas (idempotente)
├── public/
│   ├── css/
│   │   └── style.css              ← Estilos personalizados
│   ├── js/
│   │   ├── auth.js                ← Lógica de autenticación frontend
│   │   └── [entity].js            ← Lógica CRUD frontend
│   └── index.html                 ← SPA principal
├── routes/
│   ├── authRoutes.js              ← Rutas públicas (/api/auth/*)
│   └── [entity]Routes.js          ← Rutas protegidas (/api/[entity]/*)
├── .env                           ← Variables de entorno
├── .gitignore                     ← Ignorar node_modules, .env
├── package.json                   ← Dependencias
├── server.js                      ← Entrada principal
├── Dockerfile                     ← Container Node.js
├── docker-compose.yml             ← Orquestación Node + MySQL
└── AGENT.md                       ← Memoria técnica del proyecto
```

**Acciones:**
1. Inicializar proyecto: `npm init -y`
2. Instalar dependencias base:
   ```bash
   npm install express mysql2 dotenv bcryptjs express-session
   npm install --save-dev nodemon
   ```
3. Crear archivo `.env` con template (ver sección Variables de Entorno)
4. Configurar `package.json` scripts:
   ```json
   {
     "scripts": {
       "start": "node server.js",
       "dev": "nodemon server.js"
     }
   }
   ```

---

### Paso 3: Implementar Capa de Modelo (Base de Datos)

#### 3.1 Pool de Conexiones (`db/database.js`)

```javascript
const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = pool;
```

#### 3.2 Script de Inicialización (`db/seed.js`)

**Principio:** Debe ser **idempotente** (puede ejecutarse múltiples veces sin errores)

```javascript
const pool = require('./database');

async function seed() {
  try {
    // Tabla users (siempre necesaria para auth)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Tabla de entidad principal (personalizar según proyecto)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS [ENTIDAD] (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        -- CAMPOS PERSONALIZADOS AQUÍ
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    console.log('✅ Base de datos inicializada correctamente');
  } catch (error) {
    console.error('❌ Error inicializando BD:', error);
    process.exit(1);
  }
}

module.exports = seed;
```

**Personalización por proyecto:**
- Reemplazar `[ENTIDAD]` con nombre de tabla (ej: `tasks`, `products`, `clients`)
- Agregar campos específicos entre `user_id` y `created_at`
- Definir índices adicionales si es necesario

---

### Paso 4: Implementar Capa de Controlador

#### 4.1 Controlador de Autenticación (`controllers/authController.js`)

**Funcionalidades estándar:**
- `register`: Crear usuario con password hasheado
- `login`: Verificar credenciales y crear sesión
- `logout`: Destruir sesión
- `getMe`: Verificar sesión activa

**Template base:**

```javascript
const bcrypt = require('bcryptjs');
const pool = require('../db/database');

const authController = {
  // Registro de nuevo usuario
  register: async (req, res) => {
    try {
      const { username, email, password } = req.body;
      
      // Validaciones básicas
      if (!username || !email || !password) {
        return res.status(400).json({ error: 'Todos los campos son obligatorios' });
      }

      // Verificar si usuario ya existe
      const [existingUsers] = await pool.query(
        'SELECT id FROM users WHERE email = ? OR username = ?',
        [email, username]
      );

      if (existingUsers.length > 0) {
        return res.status(409).json({ error: 'El usuario o email ya existe' });
      }

      // Hash de contraseña
      const passwordHash = await bcrypt.hash(password, 10);

      // Insertar usuario
      const [result] = await pool.query(
        'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
        [username, email, passwordHash]
      );

      res.status(201).json({ 
        message: 'Usuario registrado exitosamente',
        userId: result.insertId 
      });
    } catch (error) {
      console.error('Error en registro:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  // Login de usuario
  login: async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'Email y contraseña son obligatorios' });
      }

      // Buscar usuario
      const [users] = await pool.query(
        'SELECT * FROM users WHERE email = ?',
        [email]
      );

      if (users.length === 0) {
        return res.status(401).json({ error: 'Credenciales inválidas' });
      }

      const user = users[0];

      // Verificar contraseña
      const isValidPassword = await bcrypt.compare(password, user.password_hash);

      if (!isValidPassword) {
        return res.status(401).json({ error: 'Credenciales inválidas' });
      }

      // Crear sesión
      req.session.userId = user.id;
      req.session.username = user.username;

      res.json({ 
        message: 'Login exitoso',
        user: { id: user.id, username: user.username, email: user.email }
      });
    } catch (error) {
      console.error('Error en login:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  // Logout
  logout: (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: 'Error cerrando sesión' });
      }
      res.clearCookie('connect.sid');
      res.json({ message: 'Sesión cerrada exitosamente' });
    });
  },

  // Verificar sesión activa
  getMe: (req, res) => {
    if (req.session.userId) {
      res.json({
        isAuthenticated: true,
        user: {
          id: req.session.userId,
          username: req.session.username
        }
      });
    } else {
      res.json({ isAuthenticated: false });
    }
  }
};

module.exports = authController;
```

#### 4.2 Controlador de Entidad (`controllers/[entity]Controller.js`)

**Template base (personalizar por proyecto):**

```javascript
const pool = require('../db/database');

const [entity]Controller = {
  // Obtener todos los registros del usuario autenticado
  getAll: async (req, res) => {
    try {
      const [records] = await pool.query(
        'SELECT * FROM [ENTIDAD] WHERE user_id = ? ORDER BY created_at DESC',
        [req.session.userId]
      );
      res.json(records);
    } catch (error) {
      console.error('Error obteniendo registros:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  // Crear nuevo registro
  create: async (req, res) => {
    try {
      const { /* CAMPOS DE LA ENTIDAD */ } = req.body;

      // Validaciones
      if (/* CAMPOS OBLIGATORIOS */) {
        return res.status(400).json({ error: 'Campos obligatorios faltantes' });
      }

      const [result] = await pool.query(
        'INSERT INTO [ENTIDAD] (user_id, /* CAMPOS */) VALUES (?, /* VALORES */) ',
        [req.session.userId, /* VALORES */]
      );

      res.status(201).json({ 
        message: 'Registro creado exitosamente',
        id: result.insertId 
      });
    } catch (error) {
      console.error('Error creando registro:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  // Actualizar registro (solo si pertenece al usuario)
  update: async (req, res) => {
    try {
      const { id } = req.params;
      const { /* CAMPOS A ACTUALIZAR */ } = req.body;

      // Verificar propiedad
      const [records] = await pool.query(
        'SELECT id FROM [ENTIDAD] WHERE id = ? AND user_id = ?',
        [id, req.session.userId]
      );

      if (records.length === 0) {
        return res.status(404).json({ error: 'Registro no encontrado' });
      }

      await pool.query(
        'UPDATE [ENTIDAD] SET /* CAMPOS */ WHERE id = ?',
        [/* VALORES */, id]
      );

      res.json({ message: 'Registro actualizado exitosamente' });
    } catch (error) {
      console.error('Error actualizando registro:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  // Eliminar registro (solo si pertenece al usuario)
  delete: async (req, res) => {
    try {
      const { id } = req.params;

      // Verificar propiedad
      const [records] = await pool.query(
        'SELECT id FROM [ENTIDAD] WHERE id = ? AND user_id = ?',
        [id, req.session.userId]
      );

      if (records.length === 0) {
        return res.status(404).json({ error: 'Registro no encontrado' });
      }

      await pool.query('DELETE FROM [ENTIDAD] WHERE id = ?', [id]);

      res.json({ message: 'Registro eliminado exitosamente' });
    } catch (error) {
      console.error('Error eliminando registro:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
};

module.exports = [entity]Controller;
```

---

### Paso 5: Implementar Capa de Vista (Frontend SPA)

#### 5.1 Estructura HTML (`public/index.html`)

**Patrón:** SPA con 2 vistas (auth + dashboard) alternadas por JavaScript

```html
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>[NOMBRE_PROYECTO]</title>
  <link rel="stylesheet" href="/css/style.css">
</head>
<body>
  <!-- Vista de Autenticación -->
  <div id="auth-view" class="view">
    <div class="auth-container">
      <h1>[NOMBRE_PROYECTO]</h1>
      
      <!-- Formulario Login -->
      <form id="login-form">
        <h2>Iniciar Sesión</h2>
        <input type="email" id="login-email" placeholder="Email" required>
        <input type="password" id="login-password" placeholder="Contraseña" required>
        <button type="submit">Ingresar</button>
        <p>¿No tienes cuenta? <a href="#" id="show-register">Regístrate</a></p>
      </form>

      <!-- Formulario Registro (oculto por defecto) -->
      <form id="register-form" class="hidden">
        <h2>Crear Cuenta</h2>
        <input type="text" id="register-username" placeholder="Username" required>
        <input type="email" id="register-email" placeholder="Email" required>
        <input type="password" id="register-password" placeholder="Contraseña" required>
        <button type="submit">Registrarse</button>
        <p>¿Ya tienes cuenta? <a href="#" id="show-login">Inicia sesión</a></p>
      </form>
    </div>
  </div>

  <!-- Vista Dashboard (oculta por defecto) -->
  <div id="dashboard-view" class="view hidden">
    <header>
      <h1>Bienvenido, <span id="username-display"></span></h1>
      <button id="logout-btn">Cerrar Sesión</button>
    </header>

    <main>
      <!-- Formulario para crear nuevo registro -->
      <section class="create-form">
        <h2>Crear Nuevo [ENTIDAD]</h2>
        <form id="create-[entity]-form">
          <!-- CAMPOS DEL FORMULARIO -->
          <button type="submit">Crear</button>
        </form>
      </section>

      <!-- Lista de registros -->
      <section class="records-list">
        <h2>Mis [ENTIDADES]</h2>
        <div id="[entity]-list"></div>
      </section>
    </main>
  </div>

  <script src="/js/auth.js"></script>
  <script src="/js/[entity].js"></script>
</body>
</html>
```

#### 5.2 Lógica de Autenticación Frontend (`public/js/auth.js`)

```javascript
// Verificar sesión al cargar la página
async function checkSession() {
  try {
    const response = await fetch('/api/auth/me');
    const data = await response.json();

    if (data.isAuthenticated) {
      showDashboard(data.user);
    } else {
      showAuth();
    }
  } catch (error) {
    console.error('Error verificando sesión:', error);
    showAuth();
  }
}

// Mostrar vista de autenticación
function showAuth() {
  document.getElementById('auth-view').classList.remove('hidden');
  document.getElementById('dashboard-view').classList.add('hidden');
}

// Mostrar vista de dashboard
function showDashboard(user) {
  document.getElementById('auth-view').classList.add('hidden');
  document.getElementById('dashboard-view').classList.remove('hidden');
  document.getElementById('username-display').textContent = user.username;
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
  checkSession();

  // Toggle entre login y registro
  document.getElementById('show-register').addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('login-form').classList.add('hidden');
    document.getElementById('register-form').classList.remove('hidden');
  });

  document.getElementById('show-login').addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('register-form').classList.add('hidden');
    document.getElementById('login-form').classList.remove('hidden');
  });

  // Login
  document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (response.ok) {
        showDashboard(data.user);
        // Cargar datos del dashboard
        if (typeof load[Entity]s === 'function') {
          load[Entity]s();
        }
      } else {
        alert(data.error);
      }
    } catch (error) {
      console.error('Error en login:', error);
      alert('Error conectando con el servidor');
    }
  });

  // Registro
  document.getElementById('register-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('register-username').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password })
      });

      const data = await response.json();

      if (response.ok) {
        alert('Registro exitoso. Ahora inicia sesión.');
        document.getElementById('register-form').classList.add('hidden');
        document.getElementById('login-form').classList.remove('hidden');
      } else {
        alert(data.error);
      }
    } catch (error) {
      console.error('Error en registro:', error);
      alert('Error conectando con el servidor');
    }
  });

  // Logout
  document.getElementById('logout-btn').addEventListener('click', async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      showAuth();
    } catch (error) {
      console.error('Error en logout:', error);
    }
  });
});
```

#### 5.3 Lógica CRUD Frontend (`public/js/[entity].js`)

```javascript
// Cargar y mostrar registros
async function load[Entity]s() {
  try {
    const response = await fetch('/api/[entity]s');
    const [entity]s = await response.json();

    const listContainer = document.getElementById('[entity]-list');
    listContainer.innerHTML = '';

    if ([entity]s.length === 0) {
      listContainer.innerHTML = '<p>No hay registros aún.</p>';
      return;
    }

    [entity]s.forEach([entity] => {
      const item = document.createElement('div');
      item.className = '[entity]-item';
      item.innerHTML = `
        <!-- RENDERIZAR CAMPOS DEL [ENTIDAD] -->
        <button onclick="update[Entity](${[entity].id})">Actualizar</button>
        <button onclick="delete[Entity](${[entity].id})">Eliminar</button>
      `;
      listContainer.appendChild(item);
    });
  } catch (error) {
    console.error('Error cargando registros:', error);
  }
}

// Crear nuevo registro
document.getElementById('create-[entity]-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const data = {
    // EXTRAER CAMPOS DEL FORMULARIO
  };

  try {
    const response = await fetch('/api/[entity]s', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    const result = await response.json();

    if (response.ok) {
      alert('Registro creado exitosamente');
      load[Entity]s();
      e.target.reset();
    } else {
      alert(result.error);
    }
  } catch (error) {
    console.error('Error creando registro:', error);
  }
});

// Actualizar registro
async function update[Entity](id) {
  // Implementar según necesidades (modal, inline edit, etc.)
}

// Eliminar registro
async function delete[Entity](id) {
  if (!confirm('¿Estás seguro de eliminar este registro?')) {
    return;
  }

  try {
    const response = await fetch(`/api/[entity]s/${id}`, {
      method: 'DELETE'
    });

    const result = await response.json();

    if (response.ok) {
      alert('Registro eliminado exitosamente');
      load[Entity]s();
    } else {
      alert(result.error);
    }
  } catch (error) {
    console.error('Error eliminando registro:', error);
  }
}
```

---

### Paso 6: Configurar Rutas y Middleware

#### 6.1 Rutas de Autenticación (`routes/authRoutes.js`)

```javascript
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/logout', authController.logout);
router.get('/me', authController.getMe);

module.exports = router;
```

#### 6.2 Rutas de Entidad (`routes/[entity]Routes.js`)

```javascript
const express = require('express');
const router = express.Router();
const [entity]Controller = require('../controllers/[entity]Controller');

// Middleware de autenticación
const requireAuth = (req, res, next) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'No autenticado' });
  }
  next();
};

// Aplicar middleware a todas las rutas
router.use(requireAuth);

router.get('/', [entity]Controller.getAll);
router.post('/', [entity]Controller.create);
router.patch('/:id', [entity]Controller.update);
router.delete('/:id', [entity]Controller.delete);

module.exports = router;
```

#### 6.3 Servidor Principal (`server.js`)

```javascript
const express = require('express');
const session = require('express-session');
const path = require('path');
require('dotenv').config();

const seed = require('./db/seed');
const authRoutes = require('./routes/authRoutes');
const [entity]Routes = require('./routes/[entity]Routes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Sesiones
app.use(session({
  secret: process.env.SESSION_SECRET || 'secret-dev',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // true solo en producción con HTTPS
    maxAge: 24 * 60 * 60 * 1000 // 24 horas
  }
}));

// Rutas API
app.use('/api/auth', authRoutes);
app.use('/api/[entity]s', [entity]Routes);

// SPA wildcard - servir index.html para todas las rutas no-API
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Iniciar servidor
async function start() {
  // Inicializar base de datos
  await seed();

  app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  });
}

start().catch(err => {
  console.error('Error iniciando servidor:', err);
  process.exit(1);
});
```

---

### Paso 7: Containerización Docker

#### 7.1 Dockerfile

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3000

CMD ["node", "server.js"]
```

#### 7.2 docker-compose.yml

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DB_HOST=db
      - DB_USER=${DB_USER:-root}
      - DB_PASSWORD=${DB_PASSWORD:-secret}
      - DB_NAME=${DB_NAME:-app_db}
      - DB_PORT=3306
      - PORT=3000
      - SESSION_SECRET=${SESSION_SECRET:-secret-dev}
    depends_on:
      db:
        condition: service_healthy
    restart: unless-stopped

  db:
    image: mysql:8.0
    environment:
      - MYSQL_ROOT_PASSWORD=${DB_PASSWORD:-secret}
      - MYSQL_DATABASE=${DB_NAME:-app_db}
    volumes:
      - mysql_data:/var/lib/mysql
    ports:
      - "3306:3306"
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped

volumes:
  mysql_data:
```

#### 7.3 .gitignore

```
node_modules/
.env
*.log
.DS_Store
```

---

## Variables de Entorno (.env Template)

```env
# Base de Datos
DB_HOST=127.0.0.1          # Cambiar a 'db' en Docker
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=app_database
DB_PORT=3306

# Servidor
PORT=3000

# Sesiones
SESSION_SECRET=change-this-to-random-long-string-in-production

# Producción
NODE_ENV=development       # Cambiar a 'production' en prod
```

---

## Decisiones de Diseño Estándar

### DD-01: Pool de Conexiones vs Conexión Única
**Decisión:** Usar `mysql2/promise` con `createPool()`  
**Razón:** Reutiliza conexiones, evita overhead de abrir/cerrar. Soporta hasta 10 conexiones concurrentes por defecto.  
**Cuándo cambiar:** Para proyectos muy pequeños con <5 usuarios simultáneos, una conexión única puede ser suficiente.

### DD-02: bcryptjs vs bcrypt Nativo
**Decisión:** Usar `bcryptjs` (implementación pura JS)  
**Razón:** No requiere compilación nativa, funciona en todos los entornos sin herramientas de build.  
**Cuándo cambiar:** En producción con alto tráfico, `bcrypt` nativo es ~30% más rápido.

### DD-03: express-session vs JWT
**Decisión:** Usar sesiones server-side con `express-session`  
**Razón:** Más seguro para aplicaciones web tradicionales, fácil invalidación, no requiere almacenamiento client-side.  
**Cuándo cambiar:** Para APIs REST sin estado o aplicaciones mobile-first, usar JWT.

### DD-04: Salt Rounds = 10
**Decisión:** bcrypt con 10 salt rounds  
**Razón:** Equilibrio entre seguridad y rendimiento (~100ms por hash).  
**Cuándo cambiar:** Para datos ultra-sensibles, aumentar a 12-14 (más lento pero más seguro).

### DD-05: Aislamiento de Datos con `WHERE user_id`
**Decisión:** Todas las queries incluyen `WHERE user_id = req.session.userId`  
**Razón:** Previene que usuarios accedan a datos de otros. Seguridad a nivel de base de datos.  
**Cuándo cambiar:** Para datos públicos o compartidos entre usuarios, modificar la lógica de filtrado.

### DD-06: SPA con HTML Vanilla vs Framework
**Decisión:** Single Page Application con JavaScript vanilla  
**Razón:** Sin dependencias adicionales, carga rápida, ideal para proyectos simples.  
**Cuándo cambiar:** Para UIs complejas con mucho estado, considerar React/Vue/Angular.

### DD-07: Seed Idempotente
**Decisión:** `CREATE TABLE IF NOT EXISTS` en lugar de DROP+CREATE  
**Razón:** Permite reiniciar el servidor sin perder datos. Seguro para desarrollo y producción.  
**Cuándo cambiar:** En desarrollo temprano donde se necesita resetear datos frecuentemente, usar DROP+CREATE.

### DD-08: Wildcard Route para SPA
**Decisión:** `app.get('*', ...)` sirve index.html para rutas no-API  
**Razón:** Soporta navegación directa a URLs en SPA. Previene errores 404 al recargar página.  
**Cuándo cambiar:** Para aplicaciones MPA (multi-page), servir diferentes HTMLs por ruta.

---

## Checklist de Verificación

### Antes de Entregar al Usuario

- [ ] Estructura de carpetas creada correctamente
- [ ] Todas las dependencias instaladas
- [ ] Archivo `.env` configurado con valores seguros
- [ ] Base de datos se inicializa sin errores (`npm run dev`)
- [ ] Registro de usuarios funciona
- [ ] Login/logout funciona correctamente
- [ ] CRUD completo funciona (crear, leer, actualizar, eliminar)
- [ ] Verificación de propiedad en update/delete
- [ ] Sesiones expiran correctamente
- [ ] Frontend alterna entre vistas auth/dashboard
- [ ] Docker Compose levanta sin errores
- [ ] Memoria técnica documentada en AGENT.md

### Testing Manual Rápido

```bash
# 1. Probar registro
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test","email":"test@test.com","password":"123456"}'

# 2. Probar login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"123456"}' \
  -c cookies.txt

# 3. Probar crear entidad
curl -X POST http://localhost:3000/api/[entity]s \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{/* CAMPOS */}'

# 4. Probar obtener entidades
curl http://localhost:3000/api/[entity]s -b cookies.txt

# 5. Probar sin autenticación (debe fallar)
curl http://localhost:3000/api/[entity]s
```

---

## Personalización para Diferentes Dominios

### Ejemplo 1: Gestión de Productos
```javascript
// Entidad: products
// Campos adicionales:
// - name VARCHAR(255) NOT NULL
// - description TEXT
// - price DECIMAL(10,2) NOT NULL
// - stock INT DEFAULT 0
// - category VARCHAR(100)
```

### Ejemplo 2: Sistema de Clientes
```javascript
// Entidad: clients
// Campos adicionales:
// - full_name VARCHAR(255) NOT NULL
// - phone VARCHAR(20)
// - address TEXT
// - company VARCHAR(255)
// - status ENUM('active', 'inactive') DEFAULT 'active'
```

### Ejemplo 3: Inventario
```javascript
// Entidad: inventory_items
// Campos adicionales:
// - item_name VARCHAR(255) NOT NULL
// - quantity INT NOT NULL DEFAULT 0
// - location VARCHAR(100)
// - min_stock INT DEFAULT 10
// - last_updated DATETIME
```

---

## Escalabilidad y Mejoras Futuras

### Para Producción
- [ ] Agregar rate limiting (`express-rate-limit`)
- [ ] Implementar HTTPS con Let's Encrypt
- [ ] Usar variables de entorno seguras (Vault, AWS Secrets)
- [ ] Agregar logging estructurado (Winston, Morgan)
- [ ] Implementar backups automáticos de MySQL
- [ ] Configurar monitoreo (PM2, New Relic)

### Features Avanzadas
- [ ] Paginación en listados (`LIMIT/OFFSET`)
- [ ] Búsqueda y filtros avanzados
- [ ] Subida de archivos (Multer + AWS S3)
- [ ] Notificaciones en tiempo real (WebSockets)
- [ ] Roles y permisos (admin, usuario, editor)
- [ ] API versioning (`/api/v1/...`)
- [ ] Testing automatizado (Jest, Supertest)

---

## Recursos y Documentación

- **Express.js**: https://expressjs.com/
- **mysql2**: https://www.npmjs.com/package/mysql2
- **bcryptjs**: https://www.npmjs.com/package/bcryptjs
- **express-session**: https://www.npmjs.com/package/express-session
- **Docker MySQL**: https://hub.docker.com/_/mysql

---

## Notas Finales

Este skill está diseñado para **generar aplicaciones web funcionales en minutos** manteniendo buenas prácticas de arquitectura y seguridad. 

**Principios clave:**
1. **Separación de responsabilidades**: Cada capa tiene su rol definido
2. **Seguridad por defecto**: Auth, hash passwords, aislamiento de datos
3. **Idempotencia**: Scripts pueden ejecutarse múltiples veces sin errores
4. **Documentación viva**: AGENT.md refleja decisiones reales del proyecto
5. **Containerización lista**: Docker compose para desarrollo y producción

**Adaptabilidad:** Los templates son puntos de partida. Personalizar según requisitos específicos de cada proyecto.
