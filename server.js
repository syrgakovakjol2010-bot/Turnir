const express = require('express');
const cors = require('cors');
const path = require('path'); // Добавляем модуль path
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// 1. Раздаем статические файлы (index.html, css, js) из корня проекта
app.use(express.static(path.join(__dirname, './')));

// 2. Инициализируем ботов
try {
    require('./discordBot.js');
    console.log('✅ Discord-бот подключен!');
} catch (err) {
    console.error('❌ Ошибка Discord:', err.message);
}

try {
    const { bot } = require('./bot.js');
    console.log('✅ Telegram-бот подключен!');

    app.post(`/api/telegram-webhook`, (req, res) => {
        bot.processUpdate(req.body);
        res.sendStatus(200);
    });
} catch (err) {
    console.error('❌ Ошибка Telegram:', err.message);
}

// 3. Отправка index.html на любой главный запрос
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🔥 Сервер работает на порту ${PORT}`);
});

module.exports = app;

