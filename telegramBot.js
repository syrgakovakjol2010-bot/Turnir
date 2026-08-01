const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config();

// Инициализация бота
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });

console.log('🤖 PlayNomad Telegram Bot успешно запущен!');

// 1. Привязка аккаунта Telegram к сайту NomadPlay
bot.onText(/\/start (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const userIdFromWebsite = match[1]; // Получаем ID пользователя с нашего сайта

    const telegramUsername = msg.from.username ? `@${msg.from.username}` : msg.from.first_name;

    // TODO: Здесь делаем запрос к базе данных (Neon DB) и сохраняем telegramUsername к профилю userIdFromWebsite

    bot.sendMessage(chatId, `🎉 Отлично, ${msg.from.first_name}! Твой Telegram аккаунт (${telegramUsername}) успешно привязан к платформе **PlayNomad**!`);
});

// Простая команда /start без параметров
bot.onText(/\/start$/, (msg) => {
    bot.sendMessage(msg.chat.id, `Привет, ${msg.from.first_name}! 🦅\nЭто официальный бот платформы **PlayNomad**.\n\nДля привязки аккаунта перейди в личный кабинет на сайте.`);
});

/**
 * 2. Функция для генерации ОДНОРАЗОВОЙ ссылки на приватный канал турнира
 * @param {string|number} channelChatId - ID твоего закрытого канала (например: -100123456789)
 */
async function generateOneTimeInviteLink(channelChatId) {
    try {
        const inviteLink = await bot.createChatInviteLink(channelChatId, {
            member_limit: 1, // Ссылка сработает ТОЛЬКО 1 РАЗ!
            expire_date: Math.floor(Date.now() / 1000) + 3600 // Ссылка сгорит через 1 час
        });
        return inviteLink.invite_link;
    } catch (error) {
        console.error('Ошибка создания инвайт-ссылки:', error);
        return null;
    }
}

module.exports = { bot, generateOneTimeInviteLink };
