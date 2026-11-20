const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { successEmbed, errorEmbed } = require('../../utils/embed');
const music = require('../../utils/musicManager');

module.exports = {
  category: 'Musik',
  cooldown: 2,
  data: new SlashCommandBuilder()
    .setName('skip')
    .setDescription('Lewati lagu yang sedang diputar'),
  async execute(interaction) {
    const ok = music.skip(interaction.guild.id);
    if (!ok) {
      return interaction.reply({
        embeds: [errorEmbed('Tidak Ada Lagu', 'Saat ini tidak ada lagu yang sedang diputar.')],
        flags: MessageFlags.Ephemeral,
      });
    }

    await interaction.reply({
      embeds: [successEmbed('Lagu Dilewati', 'Melanjutkan ke lagu berikutnya di antrean.')],
    });
  },
};
