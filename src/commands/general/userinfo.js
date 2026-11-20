const { SlashCommandBuilder } = require('discord.js');
const { createEmbed, COLORS } = require('../../utils/embed');

module.exports = {
  category: 'Umum',
  cooldown: 3,
  data: new SlashCommandBuilder()
    .setName('userinfo')
    .setDescription('Menampilkan informasi tentang seorang user')
    .addUserOption((option) =>
      option.setName('target').setDescription('User yang ingin dilihat infonya (kosongkan untuk diri sendiri)'),
    ),
  async execute(interaction) {
    const user = interaction.options.getUser('target') || interaction.user;
    const member = interaction.guild ? await interaction.guild.members.fetch(user.id).catch(() => null) : null;

    const createdTs = Math.floor(user.createdTimestamp / 1000);
    const fields = [
      { name: '🏷️ Username', value: user.tag, inline: true },
      { name: '🆔 User ID', value: `\`${user.id}\``, inline: true },
      { name: '🤖 Bot?', value: user.bot ? 'Ya' : 'Tidak', inline: true },
      { name: '📅 Akun Dibuat', value: `<t:${createdTs}:F> (<t:${createdTs}:R>)`, inline: false },
    ];

    if (member) {
      const joinedTs = Math.floor(member.joinedTimestamp / 1000);
      const roles = member.roles.cache
        .filter((r) => r.id !== interaction.guild.id)
        .map((r) => r.toString())
        .slice(0, 15);

      fields.push(
        { name: '📥 Bergabung di Server', value: `<t:${joinedTs}:F> (<t:${joinedTs}:R>)`, inline: false },
        { name: `🎭 Roles (${member.roles.cache.size - 1})`, value: roles.length > 0 ? roles.join(', ') : 'Tidak ada role', inline: false },
      );
    }

    const embed = createEmbed({
      title: `👤 Info User: ${user.username}`,
      color: COLORS.PRIMARY,
      thumbnail: user.displayAvatarURL({ size: 256 }),
      fields,
    });

    await interaction.reply({ embeds: [embed] });
  },
};
