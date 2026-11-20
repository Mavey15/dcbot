const { Events } = require('discord.js');
const { getGuildConfig } = require('../utils/guildConfig');
const { askGemini } = require('../utils/aiClient');
const { addMessageXp } = require('../utils/levelStore');
const { getAfk, clearAfk } = require('../utils/afkStore');

module.exports = {
  name: Events.MessageCreate,
  async execute(message) {
    if (message.author.bot || !message.guild) return;

    const guildId = message.guild.id;

    // 1. Sistem AFK: hapus status AFK jika pengirim pesan sebelumnya AFK
    const ownAfk = clearAfk(guildId, message.author.id);
    if (ownAfk) {
      message.reply(`👋 Selamat datang kembali ${message.author}! Status AFK kamu sudah dicabut.`).catch(() => {});
    }

    // Beri tahu jika me-mention user yang sedang AFK
    if (message.mentions.users.size > 0) {
      for (const [, mentionedUser] of message.mentions.users) {
        if (mentionedUser.id === message.author.id || mentionedUser.bot) continue;
        const afkInfo = getAfk(guildId, mentionedUser.id);
        if (afkInfo) {
          const ts = Math.floor(afkInfo.since / 1000);
          message
            .reply(`💤 **${mentionedUser.username}** sedang AFK sejak <t:${ts}:R>: *${afkInfo.reason}*`)
            .catch(() => {});
          break;
        }
      }
    }

    // 2. Sistem Leveling & XP otomatis
    const xpResult = addMessageXp(guildId, message.author.id);
    if (xpResult.leveledUp) {
      message.channel
        .send(`🎉 Selamat ${message.author}! Kamu baru saja naik ke **Level ${xpResult.level}**!`)
        .catch(() => {});
    }

    // 3. Sistem Chatbot AI (di channel #ai-chat atau saat mention @Bot)
    const config = getGuildConfig(guildId);
    const isAiChannel = config.aiChannelId && message.channel.id === config.aiChannelId;
    const isMentioned = message.mentions.has(message.client.user.id);

    if (!isAiChannel && !isMentioned) return;

    const prompt = message.content.replace(new RegExp(`<@!?${message.client.user.id}>`, 'g'), '').trim();
    if (!prompt) return;

    if (!process.env.GEMINI_API_KEY) {
      await message.reply(
        '⚠️ `GEMINI_API_KEY` belum diisi di file `.env`. Dapatkan gratis di https://aistudio.google.com/apikey lalu restart bot.',
      );
      return;
    }

    try {
      await message.channel.sendTyping();
      const reply = await askGemini(`${message.author.username}: ${prompt}`, message.channel.id);

      if (reply.length <= 2000) {
        await message.reply(reply);
      } else {
        const chunks = reply.match(/[\s\S]{1,1950}/g) || [];
        for (let i = 0; i < chunks.length; i++) {
          if (i === 0) {
            await message.reply(chunks[i]);
          } else {
            await message.channel.send(chunks[i]);
          }
        }
      }
    } catch (error) {
      console.error('AI MessageCreate error:', error);
      await message.reply('❌ Maaf, terjadi kendala saat menghubungi AI. Coba lagi sebentar ya.').catch(() => {});
    }
  },
};
