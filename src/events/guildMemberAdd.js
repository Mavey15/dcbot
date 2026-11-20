const { Events } = require('discord.js');
const { createEmbed, COLORS } = require('../utils/embed');
const { getGuildConfig } = require('../utils/guildConfig');

module.exports = {
  name: Events.GuildMemberAdd,
  async execute(member) {
    const config = getGuildConfig(member.guild.id);
    if (config.mode === 'music') return;

    // 1. Auto-Role jika dikonfigurasi lewat /setup
    if (config.autoRoleId) {
      const role = member.guild.roles.cache.get(config.autoRoleId);
      if (role) {
        await member.roles.add(role).catch((err) => {
          console.warn(`Gagal memberi auto-role di ${member.guild.name}:`, err.message);
        });
      }
    }

    // 2. Pesan Welcome
    const channelId = config.welcomeChannelId || process.env.WELCOME_CHANNEL_ID;
    const channel = channelId
      ? member.guild.channels.cache.get(channelId)
      : member.guild.systemChannel;

    if (!channel || !channel.isTextBased()) return;

    const embed = createEmbed({
      title: '🎉 Selamat Datang!',
      description: `Halo ${member}, selamat datang di **${member.guild.name}**!\nKamu adalah member ke-**${member.guild.memberCount}**.`,
      color: COLORS.SUCCESS,
      thumbnail: member.user.displayAvatarURL({ size: 256 }),
      footer: { text: `User ID: ${member.id}` },
    });

    await channel.send({ embeds: [embed] }).catch(() => {});
  },
};
