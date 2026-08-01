const { Client, GatewayIntentBits } = require('discord.js');
require('dotenv').config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildVoiceStates
    ]
});

client.once('ready', () => {
    console.log(`🟢 Discord-бот авторизован как ${client.user.tag}!`);
});

const token = process.env.DISCORD_BOT_TOKEN;

if (token) {
    client.login(token).catch(err => {
        console.error('❌ Ошибка входа Discord-бота:', err.message);
    });
} else {
    console.error('❌ DISCORD_BOT_TOKEN не задан!');
}

module.exports = client;
