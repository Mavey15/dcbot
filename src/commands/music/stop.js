const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { successEmbed, errorEmbed } = require('../../utils/embed');
const music = require('../../utils/musicManager');

module.exports = {
  category: 'Musik',
  cooldown: 2,
  data: new SlashCommandBuilder()
    .setName('stop')
    .setDescription('Hentikan musik, hapus antrean, dan keluar dari voice channel'),
  async execute(interaction) {
    const ok = music.stop(interaction.guild.id);
    if (!ok) {
      return interaction.reply({
        embeds: [errorEmbed('Bot Tidak Aktif', 'Bot sedang tidak memutar musik di voice channel.')],
        flags: MessageFlags.Ephemeral,
      });
    }

    await interaction.reply({
      embeds: [successEmbed('Musik Dihentikan', 'Antrean dibersihkan dan bot keluar dari voice channel.')],
    });
  },
};
