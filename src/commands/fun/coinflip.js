const { SlashCommandBuilder } = require('discord.js');
const { createEmbed, COLORS } = require('../../utils/embed');

module.exports = {
  category: 'Fun',
  cooldown: 2,
  data: new SlashCommandBuilder()
    .setName('coinflip')
    .setDescription('Lempar koin (Heads atau Tails)'),
  async execute(interaction) {
    const result = Math.random() < 0.5 ? '🪙 **Heads (Angka)**' : '🪙 **Tails (Gambar)**';

    const embed = createEmbed({
      title: 'Lempar Koin',
      description: `Hasil lemparan: ${result}`,
      color: COLORS.INFO,
    });

    await interaction.reply({ embeds: [embed] });
  },
};
