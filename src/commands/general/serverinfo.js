const { SlashCommandBuilder, ChannelType } = require('discord.js');
const { createEmbed, COLORS } = require('../../utils/embed');

module.exports = {
  category: 'Umum',
  cooldown: 5,
  data: new SlashCommandBuilder()
    .setName('serverinfo')
    .setDescription('Menampilkan informasi lengkap tentang server ini'),
  async execute(interaction) {
    const { guild } = interaction;
    if (!guild) return;

    const owner = await guild.fetchOwner();
    const textChannels = guild.channels.cache.filter((c) => c.type === ChannelType.GuildText).size;
    const voiceChannels = guild.channels.cache.filter((c) => c.type === ChannelType.GuildVoice).size;
    const createdTimestamp = Math.floor(guild.createdTimestamp / 1000);

    const embed = createEmbed({
      title: `🏠 Info Server: ${guild.name}`,
      color: COLORS.INFO,
      thumbnail: guild.iconURL({ size: 256 }),
      fields: [
        { name: '👑 Owner', value: `${owner.user.tag}`, inline: true },
        { name: '🆔 Server ID', value: `\`${guild.id}\``, inline: true },
        { name: '👥 Total Member', value: `${guild.memberCount}`, inline: true },
        { name: '💬 Channel', value: `Text: ${textChannels} | Voice: ${voiceChannels}`, inline: true },
        { name: '🎭 Total Role', value: `${guild.roles.cache.size}`, inline: true },
        { name: '🚀 Boost', value: `Level ${guild.premiumTier} (${guild.premiumSubscriptionCount ?? 0} boost)`, inline: true },
        { name: '📅 Dibuat Pada', value: `<t:${createdTimestamp}:F> (<t:${createdTimestamp}:R>)`, inline: false },
      ],
    });

    await interaction.reply({ embeds: [embed] });
  },
};
