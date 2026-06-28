/**
 * public/js/tasks.js
 * Capa de Vista — Lógica de gestión de tareas del lado del cliente.
 * Implementa el CRUD completo de tareas comunicándose con la API REST.
 * Decisión de diseño: Separado en funciones atómicas para facilitar
 * el mantenimiento y la lectura del código.
 */

// ─── Referencias al DOM ───────────────────────────────────────────────────────
const taskForm      = document.getElementById('taskForm');
const tasksContainer= document.getElementById('tasksContainer');
const tasksMeta     = document.getElementById('tasksMeta');
const toastTask     = document.getElementById('toastTask');
const submitBtn     = document.getElementById('submitTask');
const submitSpinner = document.getElementById('spinnerTask');
const submitText    = submitBtn ? submitBtn.querySelector('span') : null;

// ─── Cargar Tareas (Read) ─────────────────────────────────────────────────────
/**
 * Obtiene todas las tareas del usuario autenticado y las renderiza.
 * Función global para que auth.js pueda llamarla al mostrar el dashboard.
 */
async function fetchTasks() {
  tasksContainer.innerHTML = '<div class="empty-state">Cargando tareas...</div>';
  try {
    const res  = await fetch('/api/tasks');
    const data = await res.json();

    if (data.success) {
      renderTasks(data.data);
      updateMeta(data.data);
    } else {
      tasksContainer.innerHTML = '<div class="empty-state">No se pudieron cargar las tareas.</div>';
    }
  } catch {
    tasksContainer.innerHTML = '<div class="empty-state">Error de conexión al servidor.</div>';
  }
}

// ─── Renderizar Lista de Tareas ───────────────────────────────────────────────
function renderTasks(tasks) {
  if (!tasks || tasks.length === 0) {
    tasksContainer.innerHTML = `
      <div class="empty-state">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
        </svg>
        <p>¡Sin tareas pendientes!<br>Crea tu primera tarea.</p>
      </div>`;
    return;
  }

  tasksContainer.innerHTML = '';
  tasks.forEach(task => {
    const item = document.createElement('div');
    item.className = `task-item${task.completed ? ' completed' : ''}`;
    item.id = `task-${task.id}`;
    item.innerHTML = `
      <div class="task-left">
        <label class="chk-wrap" title="${task.completed ? 'Marcar incompleta' : 'Marcar completada'}">
          <input type="checkbox" ${task.completed ? 'checked' : ''}
                 onchange="toggleTask(${task.id}, this.checked)" />
          <span class="checkmark"></span>
        </label>
        <div class="task-details">
          <span class="task-title">${escapeHTML(task.title)}</span>
          ${task.description ? `<span class="task-desc">${escapeHTML(task.description)}</span>` : ''}
        </div>
      </div>
      <button class="btn-delete" onclick="deleteTask(${task.id})" title="Eliminar tarea" aria-label="Eliminar tarea">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="3 6 5 6 21 6"></polyline>
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
        </svg>
      </button>`;
    tasksContainer.appendChild(item);
  });
}

// ─── Actualizar Contador de Tareas ────────────────────────────────────────────
function updateMeta(tasks) {
  if (!tasksMeta || !tasks) return;
  const total     = tasks.length;
  const completed = tasks.filter(t => t.completed).length;
  tasksMeta.textContent = `${completed} de ${total} completada${total !== 1 ? 's' : ''}`;
}

// ─── Crear Tarea (Create) ─────────────────────────────────────────────────────
taskForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const title       = document.getElementById('taskTitle').value.trim();
  const description = document.getElementById('taskDesc').value.trim();

  if (!title) {
    return showTaskToast('El título es obligatorio.', 'error');
  }

  setTaskLoading(true, 'Guardando...');

  try {
    const res  = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description })
    });
    const data = await res.json();

    if (res.ok && data.success) {
      showTaskToast('¡Tarea creada exitosamente!', 'success');
      taskForm.reset();
      fetchTasks();
    } else {
      showTaskToast(data.message || 'Error al crear la tarea.', 'error');
    }
  } catch {
    showTaskToast('Error de red al guardar la tarea.', 'error');
  } finally {
    setTaskLoading(false, 'Agregar Tarea');
  }
});

// ─── Cambiar Estado (Update) ──────────────────────────────────────────────────
async function toggleTask(id, completed) {
  try {
    const res  = await fetch(`/api/tasks/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed })
    });
    const data = await res.json();

    if (res.ok && data.success) {
      const item = document.getElementById(`task-${id}`);
      if (item) item.classList.toggle('completed', completed);
      // Actualizar contador
      fetchTasks();
    } else {
      showTaskToast('No se pudo actualizar el estado.', 'error');
      fetchTasks(); // Revertir estado visual
    }
  } catch {
    showTaskToast('Error de red al actualizar.', 'error');
    fetchTasks();
  }
}

// ─── Eliminar Tarea (Delete) ──────────────────────────────────────────────────
async function deleteTask(id) {
  if (!confirm('¿Deseas eliminar esta tarea? Esta acción no se puede deshacer.')) return;

  try {
    const res  = await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
    const data = await res.json();

    if (res.ok && data.success) {
      // Animación de salida antes de recargar
      const item = document.getElementById(`task-${id}`);
      if (item) {
        item.style.opacity    = '0';
        item.style.transform  = 'translateX(20px)';
        item.style.transition = 'all 0.3s ease';
        setTimeout(() => fetchTasks(), 300);
      } else {
        fetchTasks();
      }
      showTaskToast('Tarea eliminada.', 'success');
    } else {
      showTaskToast('No se pudo eliminar la tarea.', 'error');
    }
  } catch {
    showTaskToast('Error de red al eliminar.', 'error');
  }
}

// ─── Utilidades ───────────────────────────────────────────────────────────────
function showTaskToast(msg, type) {
  toastTask.textContent = msg;
  toastTask.className   = `toast ${type}`;
  if (type !== 'none') {
    setTimeout(() => { toastTask.className = 'toast'; }, 3500);
  }
}

function setTaskLoading(isLoading, text) {
  if (!submitBtn) return;
  submitBtn.disabled = isLoading;
  if (submitSpinner) submitSpinner.classList.toggle('visible', isLoading);
  if (submitText)  submitText.textContent = text;
}

function escapeHTML(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
