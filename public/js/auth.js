/**
 * public/js/auth.js
 * Capa de Vista — Lógica de autenticación del lado del cliente.
 * Maneja el flujo de login, registro y verificación de sesión.
 * Decisión de diseño: Se verifica la sesión con GET /api/auth/me al cargar
 * la página para decidir qué vista mostrar sin redireccionamiento de páginas (SPA).
 */

// ─── Referencias al DOM ───────────────────────────────────────────────────────
const authView      = document.getElementById('authView');
const dashboardView = document.getElementById('dashboardView');

const tabLogin    = document.getElementById('tabLogin');
const tabRegister = document.getElementById('tabRegister');
const formLogin   = document.getElementById('formLogin');
const formRegister= document.getElementById('formRegister');

const toastAuth   = document.getElementById('toastAuth');

// ─── Inicialización ───────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', checkSession);

/**
 * Verifica si hay una sesión activa al cargar la página.
 * Si la hay, muestra el dashboard; si no, muestra el formulario de auth.
 */
async function checkSession() {
  try {
    const res  = await fetch('/api/auth/me');
    const data = await res.json();
    if (data.success) {
      showDashboard(data.user);
    } else {
      showAuth();
    }
  } catch {
    showAuth();
  }
}

// ─── Control de Vistas ────────────────────────────────────────────────────────
function showAuth() {
  authView.classList.add('active');
  dashboardView.classList.remove('active');
}

function showDashboard(user) {
  authView.classList.remove('active');
  dashboardView.classList.add('active');
  // Mostrar nombre de usuario en el header
  const usernameEl = document.getElementById('dashUsername');
  if (usernameEl) usernameEl.textContent = `Hola, ${user.username} 👋`;
  // Cargar tareas
  if (typeof fetchTasks === 'function') fetchTasks();
}

// ─── Tabs Login / Registro ────────────────────────────────────────────────────
tabLogin.addEventListener('click', () => {
  tabLogin.classList.add('active');
  tabRegister.classList.remove('active');
  formLogin.classList.add('active');
  formRegister.classList.remove('active');
  clearToast();
});

tabRegister.addEventListener('click', () => {
  tabRegister.classList.add('active');
  tabLogin.classList.remove('active');
  formRegister.classList.add('active');
  formLogin.classList.remove('active');
  clearToast();
});

// ─── Login ────────────────────────────────────────────────────────────────────
formLogin.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email    = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  const btn      = document.getElementById('btnLogin');
  const spinner  = document.getElementById('spinnerLogin');
  const btnText  = btn.querySelector('span');

  if (!email || !password) {
    return showToast('Completa todos los campos.', 'error');
  }

  setLoading(btn, spinner, btnText, true, 'Iniciando sesión...');

  try {
    const res  = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();

    if (res.ok && data.success) {
      showToast('¡Bienvenido de vuelta!', 'success');
      setTimeout(() => showDashboard(data.user), 600);
    } else {
      showToast(data.message || 'Credenciales incorrectas.', 'error');
    }
  } catch {
    showToast('Error de conexión al servidor.', 'error');
  } finally {
    setLoading(btn, spinner, btnText, false, 'Iniciar Sesión');
  }
});

// ─── Registro ─────────────────────────────────────────────────────────────────
formRegister.addEventListener('submit', async (e) => {
  e.preventDefault();
  const username  = document.getElementById('regUsername').value.trim();
  const email     = document.getElementById('regEmail').value.trim();
  const password  = document.getElementById('regPassword').value;
  const btn       = document.getElementById('btnRegister');
  const spinner   = document.getElementById('spinnerRegister');
  const btnText   = btn.querySelector('span');

  if (!username || !email || !password) {
    return showToast('Completa todos los campos.', 'error');
  }
  if (password.length < 6) {
    return showToast('La contraseña debe tener al menos 6 caracteres.', 'error');
  }

  setLoading(btn, spinner, btnText, true, 'Registrando...');

  try {
    const res  = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password })
    });
    const data = await res.json();

    if (res.ok && data.success) {
      showToast('¡Cuenta creada! Bienvenido.', 'success');
      setTimeout(() => showDashboard(data.user), 700);
    } else {
      showToast(data.message || 'Error al registrarse.', 'error');
    }
  } catch {
    showToast('Error de conexión al servidor.', 'error');
  } finally {
    setLoading(btn, spinner, btnText, false, 'Crear Cuenta');
  }
});

// ─── Logout ───────────────────────────────────────────────────────────────────
document.getElementById('btnLogout').addEventListener('click', async () => {
  try {
    await fetch('/api/auth/logout', { method: 'POST' });
  } catch { /* ignorar */ } finally {
    showAuth();
    // Limpiar lista de tareas para la próxima sesión
    const container = document.getElementById('tasksContainer');
    if (container) container.innerHTML = '<div class="empty-state">Cargando tareas...</div>';
  }
});

// ─── Utilidades ───────────────────────────────────────────────────────────────
function showToast(msg, type) {
  toastAuth.textContent = msg;
  toastAuth.className   = `toast ${type}`;
  if (type !== 'none') {
    setTimeout(() => { toastAuth.className = 'toast'; }, 4000);
  }
}

function clearToast() {
  toastAuth.className = 'toast';
  toastAuth.textContent = '';
}

function setLoading(btn, spinner, textEl, isLoading, text) {
  btn.disabled        = isLoading;
  spinner.classList.toggle('visible', isLoading);
  textEl.textContent  = text;
}
