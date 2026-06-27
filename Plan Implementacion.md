# Plan de Adaptación: Gestor de Tareas (Todo List)

Este plan detalla los cambios para transformar la aplicación actual (formulario de contacto) en un **Gestor de Tareas** completo con persistencia en base de datos (MySQL).

## Proposed Changes

### Base de Datos e Infraestructura

#### [MODIFY] [docker-compose.yml](file:///Users/admin/Documents/UNIR2025/MATERIAS-MASTER-2025/materias-master-devops2025/webpage-personal/docker-compose.yml)
- (Opcional/Informativo) La base de datos `personal_web` se mantendrá, pero las tareas se almacenarán en una tabla llamada `tasks`.

---

### Backend (Modelo, Controlador, Rutas)

#### [NEW] [TaskModel.js](file:///Users/admin/Documents/UNIR2025/MATERIAS-MASTER-2025/materias-master-devops2025/webpage-personal/src/models/TaskModel.js)
- Definición de consultas SQL para:
  - Crear una tarea (`id`, `title`, `description`, `completed`, `created_at`).
  - Obtener todas las tareas.
  - Actualizar el estado de completado (`completed`).
  - Eliminar una tarea.

#### [NEW] [TaskController.js](file:///Users/admin/Documents/UNIR2025/MATERIAS-MASTER-2025/materias-master-devops2025/webpage-personal/src/controllers/TaskController.js)
- Métodos para manejar las solicitudes de CRUD:
  - `createTask` (con validación de campos obligatorios).
  - `getTasks`.
  - `updateTaskStatus`.
  - `deleteTask`.

#### [NEW] [TaskRoute.js](file:///Users/admin/Documents/UNIR2025/MATERIAS-MASTER-2025/materias-master-devops2025/webpage-personal/src/routes/TaskRoute.js)
- Enrutamiento de peticiones hacia el `TaskController`:
  - `POST /api/tasks` -> Crear tarea.
  - `GET /api/tasks` -> Listar tareas.
  - `PATCH /api/tasks/:id` -> Cambiar estado completado.
  - `DELETE /api/tasks/:id` -> Eliminar tarea.

#### [MODIFY] [server.js](file:///Users/admin/Documents/UNIR2025/MATERIAS-MASTER-2025/materias-master-devops2025/webpage-personal/server.js)
- Registrar las rutas `/api/tasks` en lugar de `/api/contact`.

#### [DELETE] [ContactModel.js](file:///Users/admin/Documents/UNIR2025/MATERIAS-MASTER-2025/materias-master-devops2025/webpage-personal/src/models/ContactModel.js)
- Eliminar el antiguo modelo de contactos.

#### [DELETE] [ContactController.js](file:///Users/admin/Documents/UNIR2025/MATERIAS-MASTER-2025/materias-master-devops2025/webpage-personal/src/controllers/ContactController.js)
- Eliminar el antiguo controlador de contactos.

#### [DELETE] [ContactRoute.js](file:///Users/admin/Documents/UNIR2025/MATERIAS-MASTER-2025/materias-master-devops2025/webpage-personal/src/routes/ContactRoute.js)
- Eliminar las antiguas rutas de contacto.

---

### Vista (Frontend)

#### [MODIFY] [index.html](file:///Users/admin/Documents/UNIR2025/MATERIAS-MASTER-2025/materias-master-devops2025/webpage-personal/public/index.html)
- Diseñar una interfaz interactiva y premium para la gestión de tareas (lista de tareas dinámicas con checkboxes para marcar completado, botón para eliminar y un formulario elegante para crear tareas).

## Verification Plan

### Manual Verification
1. Verificar que al cargar la página se listan las tareas existentes.
2. Crear una nueva tarea con título y descripción, comprobando que se añade visualmente y se persiste.
3. Marcar/desmarcar una tarea como completada y verificar el cambio de estado.
4. Eliminar una tarea y constatar que desaparece de la lista.
