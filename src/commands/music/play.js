const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { createEmbed, errorEmbed, COLORS } = require('../../utils/embed');
const music = require('../../utils/musicManager');

module.exports = {
  category: 'Musik',
  cooldown: 3,
  data: new SlashCommandBuilder()
    .setName('play')
    .setDescription('Putar lagu atau playlist (judul lagu, link YouTube/Playlist, atau SoundCloud)')
    .addStringOption((opt) =>
      opt.setName('lagu').setDescription('Judul lagu, link lagu, atau link Playlist YouTube').setRequired(true),
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
      const result = await music.enqueue(interaction, voiceChannel, query);

      if (result.isPlaylist) {
        await interaction.editReply({
          embeds: [
            createEmbed({
              title: '📜 Playlist YouTube Ditambahkan!',
              description: `**[${result.playlistTitle}](${result.playlistUrl})**\nBerhasil memasukkan **${result.addedCount} lagu** ke antrean!`,
              color: COLORS.SUCCESS,
              thumbnail: result.thumbnail,
              fields: [
                { name: '▶️ Lagu Pertama', value: result.firstTrack.title, inline: false },
                { name: '💡 Tips', value: 'Gunakan `/shuffle` untuk mengacak antrean atau `/queue` untuk melihat daftarnya.', inline: false },
              ],
            }),
          ],
        });
        return;
      }

      const { track, position } = result;
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
          ? 'Lagu atau playlist tidak ditemukan. Pastikan playlist bersifat **Public** atau **Unlisted** (bukan Private).'
          : 'Gagal memutar musik. Pastikan link valid dan bot punya izin masuk ke voice channel.';

      await interaction.editReply({ embeds: [errorEmbed('Gagal Memutar Musik', msg)] });
    }
  },
};
