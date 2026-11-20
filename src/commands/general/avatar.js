const { SlashCommandBuilder } = require('discord.js');
const { createEmbed, COLORS } = require('../../utils/embed');

module.exports = {
  category: 'Umum',
  cooldown: 3,
  data: new SlashCommandBuilder()
    .setName('avatar')
    .setDescription('Menampilkan foto profil (avatar) seorang user')
    .addUserOption((option) =>
      option.setName('target').setDescription('User yang ingin dilihat avatarnya'),
    ),
  async execute(interaction) {
    const user = interaction.options.getUser('target') || interaction.user;
    const avatarUrl = user.displayAvatarURL({ size: 1024, extension: 'png' });

    const embed = createEmbed({
      title: `🖼️ Avatar ${user.username}`,
      description: `[Buka resolusi penuh](${avatarUrl})`,
      color: COLORS.PRIMARY,
      image: avatarUrl,
    });

    await interaction.reply({ embeds: [embed] });
  },
};
