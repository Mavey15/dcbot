const { Events } = require('discord.js');
const { createEmbed, COLORS } = require('../utils/embed');
const { getGuildConfig } = require('../utils/guildConfig');

module.exports = {
  name: Events.GuildMemberRemove,
  async execute(member) {
    const config = getGuildConfig(member.guild.id);
    if (config.mode === 'music') return;
    const channelId = config.welcomeChannelId || process.env.WELCOME_CHANNEL_ID;
    const channel = channelId
      ? member.guild.channels.cache.get(channelId)
      : member.guild.systemChannel;

    if (!channel || !channel.isTextBased()) return;

    const embed = createEmbed({
      title: '👋 Sampai Jumpa!',
      description: `**${member.user.tag}** baru saja meninggalkan **${member.guild.name}**.\nSekarang tersisa **${member.guild.memberCount}** member.`,
      color: COLORS.ERROR,
      thumbnail: member.user.displayAvatarURL({ size: 256 }),
      footer: { text: `User ID: ${member.id}` },
    });

    await channel.send({ embeds: [embed] }).catch(() => {});
  },
};
