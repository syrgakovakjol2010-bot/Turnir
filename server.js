const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Базовый маршрут для проверки работы сервера
app.get('/', (req, res) => {
    res.send('🚀 Сервер PUBG Arena KG / PlayNomad работает!');
});

// ==========================================
// 🤖 ИНИЦИАЛИЗАЦИЯ БОТОВ (Discord & Telegram)
// ==========================================

// 1. Подключаем Discord-бота
try {
    require('./discordBot.js');
    console.log('✅ Discord-бот успешно подключен к серверу!');
} catch (err) {
    console.error('❌ Ошибка инициализации Discord-бота:', err.message);
}

// 2. Подключаем Telegram-бота
try {
    const { bot } = require('./bot.js');
    console.log('✅ Telegram-бот успешно подключен к серверу!');

    // Webhook-эндпоинт для Vercel (чтобы Telegram присылал сообщения сразу на сервер)
    app.post(`/api/telegram-webhook`, (req, res) => {
        bot.processUpdate(req.body);
        res.sendStatus(200);
    });
} catch (err) {
    console.error('❌ Ошибка инициализации Telegram-бота:', err.message);
}

// ==========================================
// 🌐 ЗАПУСК СЕРВЕРА
// ==========================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🔥 Сервер запущен на порту ${PORT}`);
});

module.exports = app;
