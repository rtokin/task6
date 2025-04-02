const express = require('express');
const session = require('express-session');
const cors = require('cors');
const path = require('path');

const app = express();

// Middleware
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Конфигурация сессии
app.use(session({
  name: 'auth.sid', // Явное имя для куки
  secret: 'your_strong_secret_key_32_chars_min_!@#$%^&*()',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // В продакшене должно быть true для HTTPS
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 часа
    sameSite: 'lax'
  },
  store: new session.MemoryStore() // Для разработки, в продакшене используйте Redis или другую БД
}));

// Промежуточное ПО для логирования запросов
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Маршрут для проверки работоспособности сервера
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK',
    timestamp: new Date().toISOString(),
    session: req.sessionID ? 'active' : 'none'
  });
});

// Маршрут входа
app.post('/login', (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Валидация входных данных
    if (!username || !password) {
      return res.status(400).json({ 
        success: false, 
        error: 'Требуется имя пользователя и пароль' 
      });
    }

    // Простая проверка (в реальном приложении - проверка в БД)
    if (username === 'admin' && password === '12345') {
      req.session.user = { 
        username,
        lastLogin: new Date().toISOString(),
        preferences: {
          theme: 'light' // По умолчанию светлая тема
        }
      };
      
      console.log(`User ${username} logged in. Session ID: ${req.sessionID}`);
      
      return res.json({ 
        success: true,
        user: req.session.user
      });
    }
    
    res.status(401).json({ 
      success: false, 
      error: 'Неверные учетные данные' 
    });
  } catch (err) {
    console.error('Ошибка входа:', err);
    res.status(500).json({ 
      success: false, 
      error: 'Внутренняя ошибка сервера' 
    });
  }
});

// Проверка авторизации
app.get('/check-auth', (req, res) => {
  try {
    if (req.session.user) {
      return res.json({ 
        authenticated: true, 
        user: req.session.user 
      });
    }
    res.json({ authenticated: false });
  } catch (err) {
    console.error('Ошибка проверки авторизации:', err);
    res.status(500).json({ 
      success: false, 
      error: 'Ошибка проверки авторизации' 
    });
  }
});

// Обновление предпочтений пользователя (тема)
app.post('/update-preferences', (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ 
        success: false, 
        error: 'Не авторизован' 
      });
    }

    const { theme } = req.body;
    
    if (!theme || !['light', 'dark'].includes(theme)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Некорректное значение темы' 
      });
    }

    req.session.user.preferences.theme = theme;
    req.session.save(err => {
      if (err) throw err;
      
      res.json({ 
        success: true,
        user: req.session.user
      });
    });
  } catch (err) {
    console.error('Ошибка обновления предпочтений:', err);
    res.status(500).json({ 
      success: false, 
      error: 'Ошибка обновления предпочтений' 
    });
  }
});

// Выход
app.post('/logout', (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ 
        success: false, 
        error: 'Не авторизован' 
      });
    }

    const username = req.session.user.username;
    
    req.session.destroy(err => {
      if (err) throw err;
      
      res.clearCookie('auth.sid');
      console.log(`User ${username} logged out.`);
      
      res.json({ success: true });
    });
  } catch (err) {
    console.error('Ошибка выхода:', err);
    res.status(500).json({ 
      success: false, 
      error: 'Ошибка при выходе' 
    });
  }
});

// Обработка 404
app.use((req, res) => {
  res.status(404).json({ 
    success: false, 
    error: 'Маршрут не найден' 
  });
});

// Обработка ошибок
app.use((err, req, res, next) => {
  console.error('Ошибка сервера:', err.stack);
  res.status(500).json({ 
    success: false, 
    error: 'Внутренняя ошибка сервера' 
  });
});

// Запуск сервера
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Сервер запущен на http://localhost:${PORT}`);
  console.log('Тестовые данные для входа:');
  console.log('Логин: admin');
  console.log('Пароль: 12345');
  console.log(`Текущее время: ${new Date().toISOString()}`);
});