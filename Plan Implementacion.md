# Resumen Ejecutivo: Sistema de Gestión de Tareas MVC

**Proyecto:** Aplicación web completa de gestión de tareas con arquitectura MVC de 3 capas  
**Stack Tecnológico:** Node.js 20 + Express.js + MySQL 8.0 + JavaScript vanilla  
**IDE de Desarrollo:** Qoder (IDE con asistencia de IA integrada)  
**LLM Utilizado:** Asistente de programación basado en IA (generación de código automatizada)  
**Despliegue:** Containerización Docker en AWS EC2  
**Estado:** ✅ Implementado y en producción  

---

##  Índice de Fases Implementadas

1. [Definición de Requisitos y Prompt Inicial](#1-definición-de-requisitos-y-prompt-inicial)
2. [Arquitectura del Sistema y Estructura del Proyecto](#2-arquitectura-del-sistema-y-estructura-del-proyecto)
3. [Implementación del Modelo (Capa de Datos)](#3-implementación-del-modelo-capa-de-datos)
4. [Implementación del Controlador (Lógica de Negocio)](#4-implementación-del-controlador-lógica-de-negocio)
5. [Implementación de la Vista (Frontend SPA)](#5-implementación-de-la-vista-frontend-spa)
6. [Configuración de Rutas y Middleware](#6-configuración-de-rutas-y-middleware)
7. [Containerización y Dockerización](#7-containerización-y-dockerización)
8. [Resolución de Problemas de Inicialización](#8-resolución-de-problemas-de-inicialización)
9. [Despliegue en AWS](#9-despliegue-en-aws)
10. [Verificación y Testing](#10-verificación-y-testing)

---

## 1. Definición de Requisitos y Prompt Inicial

### Prompt Original Refinado
Se definió un prompt técnico profesional en [AGENT.md](AGENT.md) especificando:
- **Rol:** Experto desarrollador full stack con 10+ años de experiencia
- **Arquitectura:** MVC de 3 capas (Modelo-Vista-Controlador)
- **Funcionalidades:** CRUD completo + Autenticación de usuarios
- **Tecnologías:** HTML5, CSS3, JavaScript vanilla, Node.js, Express.js, MySQL
- **Requisitos técnicos:** API RESTful, sesiones, hash de contraseñas, pool de conexiones
- **Documentación:** Persistencia de decisiones en AGENT.md como memoria técnica

### Requisitos Funcionales Definidos
✅ Autenticación completa (registro, login, logout, sesiones)  
✅ CRUD de tareas (crear, listar, actualizar, eliminar)  
✅ Aislamiento de datos por usuario  
✅ Interfaz SPA sin recargas completas  
✅ Validación de datos en frontend y backend  

---

## 2. Arquitectura del Sistema y Estructura del Proyecto

### Stack Tecnológico Base

| Capa | Tecnología | Versión | Responsabilidad |
|---|---|---|---|
| **Modelo** | MySQL 8.0 + mysql2/promise | 8.0 | Persistencia relacional |
| **Controlador** | Node.js + Express.js | 20.x / 4.18+ | Lógica de negocio y routing |
| **Vista** | HTML5 + CSS3 + JS vanilla | ES6+ | Interfaz SPA |
| **Seguridad** | bcryptjs + express-session | 2.4+ / 1.17+ | Auth y sesiones |
| **DevOps** | Docker + docker-compose | 20+ / 2.20+ | Containerización |

### Estructura de Carpetas Implementada

```
web-gestion-tareas/
├── controllers/
│   ├── authController.js          ← Registro, login, logout, verificación sesión
│   └── taskController.js          ← CRUD de tareas con aislamiento por user_id
├── db/
│   ├── database.js                ← Pool de conexiones MySQL (mysql2/promise)
│   └── seed.js                    ← Inicialización idempotente de tablas
── public/
│   ├── css/
│   │   └── style.css              ← Estilos glassmorphism, dark mode
│   ├── js/
│   │   ├── auth.js                ← Lógica frontend: login, registro, logout
│   │   └── tasks.js               ← Lógica frontend: fetchTasks, CRUD, renderizado
│   ├── images/
│   │   └── profile.jpg            ← Foto de perfil de usuario
│   └── index.html                 ← Vista principal SPA (auth + dashboard)
├── routes/
│   ├── authRoutes.js              ← Rutas públicas (/api/auth/*)
│   └── taskRoutes.js              ← Rutas protegidas (/api/tasks/*)
├── .env                           ← Variables de entorno
├── .dockerignore                  ← Optimización de build Docker
── package.json                   ← Dependencias y scripts
── server.js                      ← Entrada principal del servidor
── Dockerfile                     ← Container Node.js 20-alpine
├── docker-compose.yml             ← Orquestación Node + MySQL con healthcheck
├── AGENT.md                       ← Memoria técnica de decisiones
├── SKILL.md                       ← Skill reutilizable para futuros proyectos
── Plan Implementacion.md         ← Este archivo
```

---

## 3. Implementación del Modelo (Capa de Datos)

### 3.1 Pool de Conexiones ([db/database.js](db/database.js))

**Decisión de Diseño DD-02:** Uso de `mysql2/promise` con `createPool()`
- **Razón:** Reutilización de conexiones, evita overhead de abrir/cerrar
- **Configuración:** 10 conexiones concurrentes máximo
- **Beneficio:** Mejor rendimiento bajo carga vs conexión única

```javascript
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});
```

### 3.2 Script de Inicialización Idempotente ([db/seed.js](db/seed.js))

**Decisión de Diseño DD-03:** `CREATE TABLE IF NOT EXISTS`
- **Razón:** Ejecución automática al arrancar sin destruir datos existentes
- **Mejora crítica:** Retry logic con 5 intentos para manejar race conditions en Docker
- **Seguridad:** `process.exit(1)` si falla definitivamente (evita servidor sin tablas)

### 3.3 Modelo de Base de Datos

#### Tabla `users`
| Campo | Tipo | Descripción |
|---|---|---|
| `id` | INT AUTO_INCREMENT PK | Identificador único |
| `username` | VARCHAR(50) UNIQUE | Nombre de usuario |
| `email` | VARCHAR(100) UNIQUE | Correo electrónico |
| `password_hash` | VARCHAR(255) | Hash bcrypt de la contraseña |
| `created_at` | DATETIME | Fecha de registro |

#### Tabla `tasks`
| Campo | Tipo | Descripción |
|---|---|---|
| `id` | INT AUTO_INCREMENT PK | Identificador único |
| `user_id` | INT FK → users.id | Propietario de la tarea |
| `title` | VARCHAR(255) | Título obligatorio |
| `description` | TEXT | Descripción opcional |
| `completed` | TINYINT(1) DEFAULT 0 | Estado: 0=pendiente, 1=completada |
| `created_at` | DATETIME | Fecha de creación |

**Relación:** `tasks.user_id` → `users.id` ON DELETE CASCADE

---

## 4. Implementación del Controlador (Lógica de Negocio)

### 4.1 Controlador de Autenticación ([controllers/authController.js](controllers/authController.js))

**Funcionalidades implementadas:**
- ✅ `register`: Crear usuario con password hasheado (bcryptjs, 10 salt rounds)
- ✅ `login`: Verificar credenciales y crear sesión
- ✅ `logout`: Destruir sesión y limpiar cookie
- ✅ `getMe`: Verificar sesión activa

**Decisiones de seguridad:**
- **DD-04:** bcryptjs (JS puro) vs bcrypt nativo → Compatible sin compilación
- **DD-05:** Aislamiento de datos con `WHERE user_id = req.session.userId`
- Validación de campos obligatorios
- Prevención de usuarios duplicados (email/username únicos)

### 4.2 Controlador de Tareas ([controllers/taskController.js](controllers/taskController.js))

**CRUD completo implementado:**
- ✅ `getAll`: Obtener tareas del usuario autenticado (filtrado por user_id)
- ✅ `create`: Crear nueva tarea con validación
- ✅ `update`: Actualizar estado `completed` con verificación de propiedad
- ✅ `delete`: Eliminar tarea con verificación de propiedad

**Seguridad:** Todas las operaciones verifican que la tarea pertenezca al usuario autenticado

---

## 5. Implementación de la Vista (Frontend SPA)

### 5.1 Arquitectura SPA ([public/index.html](public/index.html))

**Decisión de Diseño DD-06:** Single Page Application con 2 vistas
- **Vista Auth:** Formularios de login y registro (toggle entre ellos)
- **Vista Dashboard:** Panel principal con formulario de tareas y lista
- **Transiciones:** Alternancia por JavaScript según estado de sesión

**DD-01:** Separación de responsabilidades (SoC)
- CSS separado en `/public/css/style.css`
- JavaScript separado en `/public/js/auth.js` y `/public/js/tasks.js`

### 5.2 Lógica de Autenticación Frontend ([public/js/auth.js](public/js/auth.js))

**Flujo implementado:**
1. `checkSession()` al cargar página → Verifica `/api/auth/me`
2. Si autenticado → Muestra dashboard y carga tareas
3. Si no autenticado → Muestra formulario de login
4. Toggle entre login/registro sin recarga
5. Logout limpia sesión y redirige a auth

### 5.3 Lógica CRUD Frontend ([public/js/tasks.js](public/js/tasks.js))

**Funcionalidades:**
- `loadTasks()`: Fetch GET `/api/tasks` y renderizado dinámico
- Creación: POST `/api/tasks` con validación de formulario
- Actualización: PATCH `/api/tasks/:id` para toggle completed
- Eliminación: DELETE `/api/tasks/:id` con confirmación
- Renderizado condicional: Mensaje "Sin tareas pendientes" si lista vacía

### 5.4 Diseño Visual ([public/css/style.css](public/css/style.css))

**Estilo implementado:**
- Glassmorphism (efecto cristal con transparencias)
- Dark mode con gradientes oscuros
- Responsive design
- Animaciones suaves en transiciones
- Iconografía y estados visuales claros

---

## 6. Configuración de Rutas y Middleware

### 6.1 Rutas de Autenticación ([routes/authRoutes.js](routes/authRoutes.js))

**Endpoints públicos:**
| Método | Ruta | Descripción |
|---|---|---|
| `POST` | `/api/auth/register` | Registro de nuevo usuario |
| `POST` | `/api/auth/login` | Inicio de sesión |
| `POST` | `/api/auth/logout` | Cierre de sesión |
| `GET` | `/api/auth/me` | Verificar sesión activa |

### 6.2 Rutas de Tareas ([routes/taskRoutes.js](routes/taskRoutes.js))

**DD-07:** Middleware `requireAuth` aplicado a nivel de router
- Protege todas las rutas del router de una sola vez
- Verifica `req.session.userId` en cada petición

**Endpoints protegidos:**
| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/api/tasks` | Obtener todas las tareas del usuario |
| `POST` | `/api/tasks` | Crear nueva tarea |
| `PATCH` | `/api/tasks/:id` | Actualizar estado `completed` |
| `DELETE` | `/api/tasks/:id` | Eliminar tarea |

### 6.3 Servidor Principal ([server.js](server.js))

**DD-08:** Wildcard route para SPA
- `app.get('*', ...)` sirve `index.html` para rutas no-API
- Soporta navegación directa a URLs sin errores 404

**Configuración de sesiones:**
- express-session con MemoryStore
- Cookie: httpOnly, secure=false (dev), maxAge=8 horas
- Session secret desde variable de entorno

---

## 7. Containerización y Dockerización

### 7.1 Dockerfile ([Dockerfile](Dockerfile))

**Configuración:**
```dockerfile
FROM node:20-alpine          # Imagen ligera
WORKDIR /app                 # Directorio de trabajo
COPY package*.json ./        # Dependencias primero (cache de capas)
RUN npm ci --only=production # Instalación optimizada
COPY . .                     # Código fuente
EXPOSE 3000                  # Puerto de la aplicación
CMD ["npm", "start"]         # Comando de inicio
```

### 7.2 Docker Compose ([docker-compose.yml](docker-compose.yml))

**Servicios configurados:**

#### Servicio `web` (Node.js)
- Build desde Dockerfile local
- Puerto: 3000:3000
- Variables de entorno: DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, PORT
- Volumenes: `.:/app` (bind mount para desarrollo)
- **Dependencia crítica:** `depends_on: mysql condition: service_healthy`

#### Servicio `mysql` (MySQL 8.0)
- Imagen: mysql:8.0
- Variables: MYSQL_ROOT_PASSWORD, MYSQL_DATABASE
- Puerto: 3306:3306
- Volumen persistente: `db_data:/var/lib/mysql`
- **Healthcheck:** `mysqladmin ping` cada 10s, timeout 5s, 10 retries, start_period 30s

### 7.3 Optimización de Build ([.dockerignore](.dockerignore))

**Archivos excluidos:**
- node_modules (se instalan en el build)
- .env (credenciales no deben estar en imagen)
- .git, archivos de documentación
- docker-compose.yml, Dockerfile (no necesarios en runtime)

---

## 8. Resolución de Problemas de Inicialización

### 8.1 Problema Identificado: Race Condition

**Error inicial:**
```
❌ Error al inicializar la base de datos: connect ECONNREFUSED 172.20.0.2:3306
Table 'personal_web.users' doesn't exist
```

**Causa raíz:**
1. `depends_on` simple solo espera que el contenedor inicie, no que el servicio esté listo
2. MySQL tarda 10-30 segundos en inicializarse completamente
3. La app intentaba conectar inmediatamente → fallaba
4. El seed capturaba el error silenciosamente y la app iniciaba sin tablas

### 8.2 Solución Implementada

#### Corrección 1: Healthcheck en docker-compose.yml
```yaml
mysql:
  healthcheck:
    test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
    interval: 10s
    timeout: 5s
    retries: 10
    start_period: 30s

web:
  depends_on:
    mysql:
      condition: service_healthy  # Espera a que healthcheck pase
```

**Qué hace:**
- Docker verifica que MySQL responda `mysqladmin ping` exitosamente
- Solo entonces inicia el contenedor de Node.js
- Elimina el race condition completamente

#### Corrección 2: Retry Logic en seed.js
```javascript
let retries = 5;
while (retries > 0 && !connected) {
  try {
    const conn = await pool.getConnection();
    // Crear tablas...
    return; // Éxito
  } catch (err) {
    retries--;
    if (retries > 0) {
      console.warn(`⚠️  MySQL no está listo. Reintentando en 3 segundos...`);
      await new Promise(resolve => setTimeout(resolve, 3000));
    } else {
      console.error('❌ Error fatal...');
      process.exit(1); // Detiene la app si falla definitivamente
    }
  }
}
```

**Qué hace:**
- Reintenta la conexión 5 veces con 3 segundos de espera entre intentos
- Si falla definitivamente, detiene la aplicación con `process.exit(1)`
- Previene que el servidor inicie sin tablas creadas

### 8.3 Resultado

✅ **Flujo de inicio correcto:**
```
mysql_1  | [Server] mysqld: ready for connections.
web_1    | ✅ Base de datos inicializada correctamente (tablas: users, tasks).
web_1    | 🚀 Servidor ejecutándose en http://localhost:3000
```

---

## 9. Despliegue en AWS

### 9.1 Infraestructura Utilizada

**Servicio:** Amazon EC2  
**IP Pública:** 13.220.96.77  
**Puerto:** 3000 (HTTP)  
**URL de acceso:** http://13.220.96.77:3000  

### 9.2 Configuración de Despliegue

**Comandos ejecutados:**
```bash
# Clonar o subir código al servidor EC2
git clone <repositorio>
cd web-gestion-tareas

# Levantar contenedores
docker-compose up --build -d

# Verificar estado
docker-compose ps
docker-compose logs -f
```

### 9.3 Estado Actual en Producción

✅ **Aplicación funcionando:**
- Usuario autenticado: `dacl010811`
- Interfaz glassmorphism renderizada correctamente
- Dashboard funcional con formulario de tareas
- Sesión activa y persistente

### 9.4 Consideraciones de Producción

**⚠️ Recomendaciones pendientes:**

1. **HTTPS/SSL:** Configurar certificado SSL (Let's Encrypt o AWS Certificate Manager)
2. **Variables de entorno:** Mover SESSION_SECRET a AWS Secrets Manager
3. **Security Groups:**
   - ✅ Puerto 3000 abierto (requerido)
   - ✅ Puerto 3306 cerrado al público (solo acceso interno)
4. **Backup automatizado:** Script de mysqldump programado con cron
5. **Monitoreo:** PM2 o docker restart policies para alta disponibilidad
6. **Logs centralizados:** Configurar CloudWatch Logs o similar

---

## 10. Verificación y Testing

### 10.1 Testing Manual Realizado

✅ **Flujo de autenticación:**
1. Registro de nuevo usuario → Exitoso
2. Login con credenciales correctas → Exitoso
3. Verificación de sesión activa → Exitoso
4. Logout y limpieza de sesión → Exitoso

✅ **CRUD de tareas:**
1. Crear tarea con título y descripción → Exitoso
2. Listar tareas del usuario → Exitoso
3. Marcar tarea como completada → Exitoso
4. Eliminar tarea → Exitoso

✅ **Aislamiento de datos:**
- Verificación de que `WHERE user_id` filtra correctamente
- Usuarios no pueden acceder a tareas de otros

### 10.2 Comandos de Verificación en Producción

```bash
# Ver logs en tiempo real
docker-compose logs -f web
docker-compose logs -f mysql

# Verificar estado de contenedores
docker-compose ps

# Acceder a MySQL para verificar datos
docker-compose exec mysql mysql -u root -pmysqlpw personal_web

# Dentro de MySQL:
SHOW TABLES;
SELECT * FROM users;
SELECT * FROM tasks;

# Backup de base de datos
docker-compose exec mysql mysqldump -u root -pmysqlpw personal_web > backup.sql

# Verificar health de MySQL
docker-compose exec mysql mysqladmin ping -h localhost
```

### 10.3 Testing de API con cURL

```bash
# Verificar sesión activa
curl http://13.220.96.77:3000/api/auth/me

# Crear tarea (requiere sesión activa)
curl -X POST http://13.220.96.77:3000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{"title":"Mi tarea","description":"Descripción"}' \
  -b cookies.txt

# Listar tareas
curl http://13.220.96.77:3000/api/tasks -b cookies.txt
```

---

## 📊 Resumen de Decisiones de Diseño Documentadas

| ID | Decisión | Justificación |
|---|---|---|
| **DD-01** | Separación CSS/JS del HTML | Cumple principio SoC, facilita mantenimiento |
| **DD-02** | Pool de conexiones MySQL | Reutiliza conexiones, mejor rendimiento |
| **DD-03** | Seed idempotente con IF NOT EXISTS | No destruye datos en reinicios |
| **DD-04** | bcryptjs vs bcrypt nativo | Compatible sin compilación nativa |
| **DD-05** | Aislamiento con WHERE user_id | Seguridad: usuarios no acceden datos ajenos |
| **DD-06** | SPA con 2 vistas | Mejor UX, sin recargas completas |
| **DD-07** | Middleware a nivel de router | Protección global sin repetir código |
| **DD-08** | Wildcard route para SPA | Soporta navegación directa a URLs |

---

## 🎯 Objetivo Final Alcanzado

### ✅ **Sistema de Gestión de Tareas en Producción**

**Logros:**
- ✅ Arquitectura MVC completa de 3 capas implementada
- ✅ Autenticación y autorización funcionando
- ✅ CRUD completo con validación y seguridad
- ✅ Interfaz SPA moderna con diseño glassmorphism
- ✅ Containerización Docker con orquestación docker-compose
- ✅ Race condition resuelto con healthcheck y retry logic
- ✅ Despliegue exitoso en AWS EC2
- ✅ Aplicación accesible en http://13.220.96.77:3000
- ✅ Documentación completa en AGENT.md y SKILL.md

**Tecnologías dominadas:**
- Node.js 20 + Express.js
- MySQL 8.0 con mysql2/promise
- Docker y docker-compose con healthchecks
- JavaScript vanilla ES6+
- HTML5 + CSS3 (glassmorphism)
- AWS EC2 para despliegue

**Buenas prácticas aplicadas:**
- Separación de responsabilidades (SoC)
- Pool de conexiones para rendimiento
- Seed idempotente para robustez
- Aislamiento de datos por usuario
- Hash de contraseñas con bcrypt
- Documentación viva de decisiones técnicas
- Containerización lista para producción

---

## 🚀 Próximos Pasos Recomendados

### Prioridad Alta
1. Configurar HTTPS con certificado SSL
2. Rotar SESSION_SECRET a valor seguro
3. Implementar backups automatizados de MySQL

### Prioridad Media
4. Agregar rate limiting (express-rate-limit)
5. Configurar monitoreo con PM2
6. Implementar paginación en listados de tareas

### Prioridad Baja
7. Agregar tests automatizados (Jest + Supertest)
8. Implementar roles de usuario (admin, editor, viewer)
9. Agregar notificaciones en tiempo real (WebSockets)
10. Migrar a arquitectura de microservicios si escala

---

**📅 Fecha de finalización:** Junio 28, 2026  
**👨‍💻 Desarrollador:** Asistente IA con supervisión del usuario  
**📍 Despliegue:** AWS EC2 (13.220.96.77:3000)  
**✅ Estado:** Producción activa
