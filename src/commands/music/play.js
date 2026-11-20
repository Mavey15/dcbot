const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { createEmbed, errorEmbed, COLORS } = require('../../utils/embed');
const music = require('../../utils/musicManager');

module.exports = {
  category: 'Musik',
  cooldown: 3,
  data: new SlashCommandBuilder()
    .setName('play')
    .setDescription('Putar lagu dari YouTube (judul atau link)')
    .addStringOption((opt) =>
      opt.setName('lagu').setDescription('Judul lagu atau URL YouTube').setRequired(true),
    ),
  async execute(interaction) {
    const voiceChannel = interaction.member?.voice?.channel;
    if (!voiceChannel) {
      return interaction.reply({
        embeds: [errorEmbed('Masuk Voice Channel Dulu', 'Kamu harus bergabung ke voice channel sebelum memutar musik.')],
        flags: MessageFlags.Ephemeral,
      });
    }

    const query = interaction.options.getString('lagu');
    await interaction.deferReply();

    try {
      const { track, position } = await music.enqueue(interaction, voiceChannel, query);

      if (position === 0) {
        await interaction.editReply({
          embeds: [
            createEmbed({
              title: '▶️ Memulai Pemutaran',
              description: `Bergabung ke **${voiceChannel.name}** dan memutar **[${track.title}](${track.url})**`,
              color: COLORS.SUCCESS,
            }),
          ],
        });
      } else {
        await interaction.editReply({
          embeds: [
            createEmbed({
              title: '➕ Ditambahkan ke Antrean',
              description: `**[${track.title}](${track.url})**`,
              color: COLORS.INFO,
              thumbnail: track.thumbnail,
              fields: [
                { name: '⏱️ Durasi', value: track.duration, inline: true },
                { name: '📋 Posisi Antrean', value: `#${position}`, inline: true },
              ],
            }),
          ],
        });
      }
    } catch (error) {
      console.error('Error /play:', error);
      const msg =
        error.message === 'NOT_FOUND'
          ? 'Lagu tidak ditemukan di YouTube. Coba kata kunci lain.'
          : 'Gagal memutar lagu. Pastikan link valid dan bot punya izin masuk ke voice channel.';

      await interaction.editReply({ embeds: [errorEmbed('Gagal Memutar Musik', msg)] });
    }
  },
};
