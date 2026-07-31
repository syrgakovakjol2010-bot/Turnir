const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

// 1. Указываем Vercel точно отдавать статику из папки public
const publicPath = path.join(process.cwd(), 'public');
app.use(express.static(publicPath));

// 2. Отдаём index.html на любой главный запрос
app.get('/', (req, res) => {
  res.sendFile(path.join(publicPath, 'index.html'));
});

// 3. Тестовый роут для проверки работы сервера
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'PUBG ARENA KG Работает!' });
});

// Если страница не найдена в static, отдаем index.html (для SPA)
app.get('*', (req, res) => {
  res.sendFile(path.join(publicPath, 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});

module.exports = app;
