const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Запуск ботов
try {
    require('../discordBot.js');
    console.log('✅ Discord-бот запущен!');
} catch (err) {
    console.error('❌ Ошибка Discord:', err.message);
}

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

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Сервер работает!' });
});

module.exports = app;

