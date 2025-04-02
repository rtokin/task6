document.addEventListener('DOMContentLoaded', () => {
  // Элементы DOM
  const authSection = document.getElementById('auth-section');
  const appContent = document.getElementById('app-content');
  const loginBtn = document.getElementById('login-btn');
  const logoutBtn = document.getElementById('logout-btn');
  const refreshBtn = document.getElementById('refresh-btn');
  const themeToggle = document.getElementById('theme-toggle');
  const errorMsg = document.getElementById('error-message');
  const usernameDisplay = document.getElementById('user-name');
  const lastLoginDisplay = document.getElementById('last-login');

  // Проверка авторизации при загрузке
  checkAuth();

  // Обработчик входа
  loginBtn.addEventListener('click', handleLogin);

  // Обработчик выхода
  logoutBtn.addEventListener('click', handleLogout);

  // Обработчик обновления данных
  refreshBtn.addEventListener('click', checkAuth);

  // Обработчик переключения темы
  themeToggle.addEventListener('click', toggleTheme);

  // Проверка сохраненной темы
  if (localStorage.getItem('darkTheme') === 'true') {
    document.body.classList.add('dark-theme');
    themeToggle.textContent = 'Светлая тема';
  }

  // Функция входа
  async function handleLogin() {
    try {
      const username = document.getElementById('username').value.trim();
      const password = document.getElementById('password').value.trim();

      if (!username || !password) {
        showError('Введите имя пользователя и пароль');
        return;
      }

      showLoading(true);

      const response = await fetch('http://localhost:3000/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
        credentials: 'include'
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Ошибка сервера');
      }

      if (data.success) {
        checkAuth();
      } else {
        showError(data.error || 'Ошибка авторизации');
      }
    } catch (err) {
      console.error('Ошибка входа:', err);
      showError(err.message || 'Ошибка соединения с сервером');
    } finally {
      showLoading(false);
    }
  }

  // Функция выхода
  async function handleLogout() {
    try {
      showLoading(true);
      const response = await fetch('http://localhost:3000/logout', {
        method: 'POST',
        credentials: 'include'
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Ошибка сервера');
      }

      if (data.success) {
        checkAuth();
      }
    } catch (err) {
      console.error('Ошибка выхода:', err);
      showError(err.message || 'Ошибка при выходе');
    } finally {
      showLoading(false);
    }
  }

  // Проверка авторизации
  async function checkAuth() {
    try {
      showLoading(true);
      const response = await fetch('http://localhost:3000/check-auth', {
        credentials: 'include'
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Ошибка сервера');
      }

      updateUI(data.authenticated, data.user);
    } catch (err) {
      console.error('Ошибка проверки авторизации:', err);
      updateUI(false);
    } finally {
      showLoading(false);
    }
  }

  // Обновление интерфейса
  function updateUI(isAuthenticated, user = null) {
    if (isAuthenticated && user) {
      usernameDisplay.textContent = user.username;
      if (user.lastLogin) {
        const lastLoginDate = new Date(user.lastLogin);
        lastLoginDisplay.textContent = lastLoginDate.toLocaleString();
      }
      authSection.classList.add('hidden');
      appContent.classList.remove('hidden');
    } else {
      authSection.classList.remove('hidden');
      appContent.classList.add('hidden');
    }
  }

  // Показать ошибку
  function showError(message) {
    errorMsg.textContent = message;
    errorMsg.classList.remove('hidden');
    setTimeout(() => {
      errorMsg.classList.add('hidden');
    }, 5000);
  }

  // Показать/скрыть индикатор загрузки
  function showLoading(isLoading) {
    if (isLoading) {
      loginBtn.disabled = true;
      logoutBtn.disabled = true;
      refreshBtn.disabled = true;
      loginBtn.textContent = 'Загрузка...';
    } else {
      loginBtn.disabled = false;
      logoutBtn.disabled = false;
      refreshBtn.disabled = false;
      loginBtn.textContent = 'Войти';
    }
  }

  // Переключение темы
  function toggleTheme() {
    document.body.classList.toggle('dark-theme');
    const isDark = document.body.classList.contains('dark-theme');
    localStorage.setItem('darkTheme', isDark);
    themeToggle.textContent = isDark ? 'Светлая тема' : 'Темная тема';
  }
});