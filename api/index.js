const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// 1. Подключаем Discord-бота
try {
    require('../discordBot.js');
    console.log('✅ Discord-бот запущен!');
} catch (err) {
    console.error('❌ Ошибка Discord:', err.message);
}

// 2. Подключаем Telegram-бота
try {
    const { bot } = require('../bot.js');
    console.log('✅ Telegram-бот запущен!');

    app.post('/api/telegram-webhook', (req, res) => {
        bot.processUpdate(req.body);
        res.sendStatus(200);
    });
} catch (err) {
    console.error('❌ Ошибка Telegram:', err.message);
}

// Эндпоинт для проверки статуса
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Сервер и боты работают!' });
});

module.exports = app;
