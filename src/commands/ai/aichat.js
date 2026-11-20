const { SlashCommandBuilder } = require('discord.js');
const { successEmbed } = require('../../utils/embed');
const { clearHistory } = require('../../utils/aiClient');

module.exports = {
  category: 'AI',
  cooldown: 3,
  data: new SlashCommandBuilder()
    .setName('aichat-reset')
    .setDescription('Hapus ingatan/riwayat obrolan AI di channel ini'),
  async execute(interaction) {
    clearHistory(interaction.channelId);
    await interaction.reply({
      embeds: [
        successEmbed(
          'Memori AI Direset',
          'Riwayat percakapan AI di channel ini sudah dibersihkan. Silakan mulai topik baru!',
        ),
      ],
    });
  },
};
