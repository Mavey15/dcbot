const { Events } = require('discord.js');
const { createEmbed, COLORS } = require('../utils/embed');
const { getGuildConfig } = require('../utils/guildConfig');

module.exports = {
  name: Events.MessageDelete,
  async execute(message) {
    if (!message.guild || message.author?.bot) return;

    const config = getGuildConfig(message.guild.id);
    if (config.mode === 'music' || !config.logChannelId) return;

    const logChannel = message.guild.channels.cache.get(config.logChannelId);
    if (!logChannel || !logChannel.isTextBased() || logChannel.id === message.channel.id) return;

    const content = message.content ? message.content.slice(0, 1000) : '*(Lampiran/Embed tanpa teks)*';
    const embed = createEmbed({
      title: '🗑️ Pesan Dihapus',
      color: COLORS.ERROR,
      fields: [
        { name: '👤 Pengirim', value: message.author ? `${message.author.tag} (<@${message.author.id}>)` : 'Tidak diketahui', inline: true },
        { name: '💬 Channel', value: `${message.channel}`, inline: true },
        { name: '📝 Isi Pesan', value: content, inline: false },
      ],
    });

    await logChannel.send({ embeds: [embed] }).catch(() => {});
  },
};
