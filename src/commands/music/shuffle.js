const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { successEmbed, errorEmbed } = require('../../utils/embed');
const music = require('../../utils/musicManager');

module.exports = {
  category: 'Musik',
  cooldown: 3,
  data: new SlashCommandBuilder()
    .setName('shuffle')
    .setDescription('Acak urutan lagu yang ada di dalam antrean'),
  async execute(interaction) {
    const ok = music.shuffle(interaction.guild.id);
    if (!ok) {
      return interaction.reply({
        embeds: [errorEmbed('Tidak Bisa Acak', 'Minimal harus ada 2 lagu di dalam antrean untuk diacak.')],
        flags: MessageFlags.Ephemeral,
      });
    }

    await interaction.reply({
      embeds: [successEmbed('Antrean Diacak 🔀', 'Urutan lagu di antrean berhasil diacak!')],
    });
  },
};
