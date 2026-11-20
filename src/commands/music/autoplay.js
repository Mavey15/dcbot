const { SlashCommandBuilder } = require('discord.js');
const { successEmbed, infoEmbed } = require('../../utils/embed');
const music = require('../../utils/musicManager');

module.exports = {
  category: 'Musik',
  cooldown: 2,
  data: new SlashCommandBuilder()
    .setName('autoplay')
    .setDescription('Aktifkan atau matikan pemutaran lagu otomatis (Autoplay) saat antrean habis')
    .addBooleanOption((opt) =>
      opt
        .setName('aktif')
        .setDescription('Pilih True (Aktif) atau False (Nonaktif). Kosongkan untuk toggle.'),
    ),
  async execute(interaction) {
    const choice = interaction.options.getBoolean('aktif');
    const newState = music.setAutoplay(interaction.guild.id, choice);

    await interaction.reply({
      embeds: [
        newState
          ? successEmbed(
              'Autoplay Diaktifkan (ON)',
              'Bot akan otomatis memutar lagu rekomendasi terkait setelah antrean habis.',
            )
          : infoEmbed(
              'Autoplay Dimatikan (OFF)',
              'Bot akan berhenti memutar musik setelah semua lagu di antrean selesai.',
            ),
      ],
    });
  },
};
