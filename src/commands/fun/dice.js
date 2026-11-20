const { SlashCommandBuilder } = require('discord.js');
const { createEmbed, COLORS } = require('../../utils/embed');

module.exports = {
  category: 'Fun',
  cooldown: 2,
  data: new SlashCommandBuilder()
    .setName('dice')
    .setDescription('Lempar dadu dengan jumlah sisi pilihanmu')
    .addIntegerOption((opt) =>
      opt
        .setName('sisi')
        .setDescription('Jumlah sisi dadu (default: 6)')
        .setMinValue(2)
        .setMaxValue(1000),
    ),
  async execute(interaction) {
    const sides = interaction.options.getInteger('sisi') || 6;
    const rolled = Math.floor(Math.random() * sides) + 1;

    const embed = createEmbed({
      title: `🎲 Lempar Dadu (d${sides})`,
      description: `Kamu mendapatkan angka **${rolled}**!`,
      color: COLORS.PRIMARY,
    });

    await interaction.reply({ embeds: [embed] });
  },
};
