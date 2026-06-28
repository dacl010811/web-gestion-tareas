# Gestor de Tareas — Memoria Técnica del Proyecto

## Prompt
Quiero que actúes como un experto desarrollador full stack con mas de 10 años de experiencia en el desarrollo de software con tecnologías : HTML5, Node.js, Mysql, javascript, etc. Ayúdame a desarrollar un sistema de Gestión de Tareas en el modelo 3 Capas: Modelo, Vista y Controlador que me permita realizar operaciones CRUD básicas. Quiero que lo lo hagas en el directorio 'web-gestion-tareas'.
Quiero que toda la interacción sea en español y todas las sugerencias de implementación se persistan en el archivo AGENT.md para que este
archivo actue como una memoria técnica de decisiones de diseño y arquitectura.

---

# 1. Arquitectura del Sistema (3 Capas MVC)

## Stack Tecnológico

| Capa | Tecnología | Responsabilidad |
|---|---|---|
| **Modelo** | MySQL 8 + mysql2/promise | Persistencia de datos (tablas `users`, `tasks`) |
| **Controlador** | Node.js + Express.js | Lógica de negocio, validación, auth |
| **Vista** | HTML5 + CSS3 + JavaScript vanilla | Interfaz de usuario, SPA con 2 vistas |

## Dependencias Principales

```json
{
  "express":         "^4.18.2",   // Framework HTTP
  "mysql2":          "^3.5.0",    // Driver MySQL con soporte Promise
  "dotenv":          "^16.0.3",   // Variables de entorno
  "bcryptjs":        "^2.4.3",    // Hash de contraseñas (no nativo → compatible en todos los sistemas)
  "express-session": "^1.17.3"   // Gestión de sesiones de usuario
}
```

---

# 2. Estructura del Proyecto (Files)

```
web-gestion-tareas/
├── controllers/
│   ├── authController.js      ← Registro, Login, Logout, verificación de sesión
│   └── taskController.js      ← CRUD de tareas (filtrado por user_id)
├── db/
│   ├── database.js            ← Pool de conexión MySQL (mysql2/promise)
│   └── seed.js                ← Inicialización de tablas (idempotente)
├── public/
│   ├── css/
│   │   └── style.css          ← Estilos separados (glassmorphism, dark mode)
│   ├── js/
│   │   ├── auth.js            ← Lógica frontend: login, registro, logout, checkSession
│   │   └── tasks.js           ← Lógica frontend: fetchTasks, CRUD, renderizado
│   └── images/
│       ├── favicon.ico
│       └── profile.jpg        ← Foto de perfil de Damián (generada)
│   └── index.html             ← Vista principal SPA (2 vistas: auth + dashboard)
├── routes/
│   ├── authRoutes.js          ← Rutas públicas de auth (/api/auth/*)
│   └── taskRoutes.js          ← Rutas protegidas de tareas (/api/tasks/*)
├── .env                       ← Variables de entorno (NO subir a git)
├── package.json
├── server.js                  ← Entrada principal del servidor
├── Dockerfile
├── docker-compose.yml
└── AGENT.md                   ← Este archivo (memoria técnica)
```

---

# 3. Modelo de Base de Datos

## Tabla `users`
| Campo | Tipo | Descripción |
|---|---|---|
| `id` | INT AUTO_INCREMENT PK | Identificador único |
| `username` | VARCHAR(50) UNIQUE | Nombre de usuario |
| `email` | VARCHAR(100) UNIQUE | Correo electrónico |
| `password_hash` | VARCHAR(255) | Hash bcrypt de la contraseña |
| `created_at` | DATETIME | Fecha de registro |

## Tabla `tasks`
| Campo | Tipo | Descripción |
|---|---|---|
| `id` | INT AUTO_INCREMENT PK | Identificador único |
| `user_id` | INT FK → users.id | Propietario de la tarea |
| `title` | VARCHAR(255) | Título obligatorio |
| `description` | TEXT | Descripción opcional |
| `completed` | TINYINT(1) DEFAULT 0 | Estado: 0=pendiente, 1=completada |
| `created_at` | DATETIME | Fecha de creación |

**Relación:** `tasks.user_id` → `users.id` ON DELETE CASCADE (al eliminar usuario, se eliminan sus tareas)

---

# 4. API REST — Endpoints

## Autenticación (Pública)
| Método | Ruta | Descripción |
|---|---|---|
| `POST` | `/api/auth/register` | Registro de nuevo usuario |
| `POST` | `/api/auth/login` | Inicio de sesión |
| `POST` | `/api/auth/logout` | Cierre de sesión |
| `GET` | `/api/auth/me` | Verificar sesión activa |

## Tareas (Protegida — requiere sesión)
| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/api/tasks` | Obtener todas las tareas del usuario |
| `POST` | `/api/tasks` | Crear nueva tarea |
| `PATCH` | `/api/tasks/:id` | Actualizar estado `completed` |
| `DELETE` | `/api/tasks/:id` | Eliminar tarea |

---

# 5. Decisiones de Diseño y Arquitectura

## DD-01: Separación de archivos estáticos
**Decisión:** CSS y JavaScript separados del HTML en `/public/css/` y `/public/js/`.
**Razón:** Cumple el estándar de separación de responsabilidades (SoC). Facilita el mantenimiento y cumple la estructura del AGENT.md.

## DD-02: Pool de conexiones MySQL
**Decisión:** Se usa `mysql2/promise` con `createPool()` en lugar de una sola conexión.
**Razón:** Reutiliza conexiones, evita el overhead de abrir/cerrar en cada petición. Límite de 10 conexiones concurrentes.

## DD-03: Script seed.js idempotente
**Decisión:** `CREATE TABLE IF NOT EXISTS` en lugar de DROP+CREATE.
**Razón:** El seed se ejecuta automáticamente al arrancar el servidor. Al ser idempotente, no destruye datos existentes en reinicios.

## DD-04: Autenticación con express-session + bcryptjs
**Decisión:** `bcryptjs` (implementación JS pura) en lugar de `bcrypt` (requiere compilación nativa).
**Razón:** Funciona en todos los entornos sin herramientas de compilación adicionales. Salt rounds = 10 (equilibrio seguridad/rendimiento).

## DD-05: Aislamiento de datos por usuario
**Decisión:** Todas las queries de tareas incluyen `WHERE user_id = req.session.userId`.
**Razón:** Seguridad — un usuario no puede ver, modificar ni eliminar tareas de otro usuario.

## DD-06: SPA de una sola página con 2 vistas
**Decisión:** `index.html` contiene tanto la vista de auth como la de dashboard. JavaScript alterna entre ellas según el estado de sesión (`/api/auth/me`).
**Razón:** Evita recargas completas de página. Mejor UX con transiciones animadas.

## DD-07: Middleware requireAuth en router
**Decisión:** El middleware de autenticación se aplica a nivel del router de tareas con `router.use(requireAuth)`.
**Razón:** Protege todas las rutas del router de una sola vez, sin repetir el middleware en cada ruta.

## DD-08: Wildcard route en server.js
**Decisión:** `app.get('*', ...)` sirve `index.html` para cualquier ruta no capturada por la API.
**Razón:** Soporte de SPA — si el usuario navega directamente a cualquier URL, siempre recibe el HTML principal.

---

# 6. Variables de Entorno (.env)

```env
DB_HOST=127.0.0.1
DB_USER=root
DB_PASSWORD=           # contraseña de MySQL
DB_NAME=personal_web
DB_PORT=3306
PORT=3000
SESSION_SECRET=        # secreto largo y aleatorio para producción
```

---

# 7. Cómo Ejecutar el Proyecto

## Con Node.js local
```bash
# 1. Instalar dependencias
npm install

# 2. Configurar .env con credenciales de MySQL

# 3. Iniciar en modo desarrollo
npm run dev

# 4. Abrir http://localhost:3000
```

## Con Docker Compose
```bash
# Levantar toda la infraestructura (Node + MySQL)
docker compose up --build

# Detener
docker compose down
```

---

# 8. Historial de Cambios

| Fecha | Cambio | Descripción |
|---|---|---|
| 2026-06-28 | v1.0 — Implementación inicial | CRUD de tareas sin auth, estructura `src/` |
| 2026-06-28 | v2.0 — Migración completa | Nueva arquitectura, autenticación, separación CSS/JS |
