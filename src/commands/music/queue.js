const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { createEmbed, infoEmbed, COLORS } = require('../../utils/embed');
const music = require('../../utils/musicManager');

module.exports = {
  category: 'Musik',
  cooldown: 3,
  data: new SlashCommandBuilder()
    .setName('queue')
    .setDescription('Lihat daftar antrean lagu saat ini'),
  async execute(interaction) {
    const state = music.getGuildQueue(interaction.guild.id);
    if (!state || (!state.current && state.songs.length === 0)) {
      return interaction.reply({
        embeds: [infoEmbed('Antrean Kosong', 'Belum ada lagu yang sedang diputar. Gunakan `/play` untuk memutar lagu.')],
        flags: MessageFlags.Ephemeral,
      });
    }

    const lines = [];
    if (state.current) {
      lines.push(`**🎶 Sedang Diputar:**\n[${state.current.title}](${state.current.url}) \`[${state.current.duration}]\``);
    }

    if (state.songs.length > 0) {
      const upcoming = state.songs
        .slice(0, 10)
        .map((s, i) => `**${i + 1}.** [${s.title}](${s.url}) \`[${s.duration}]\``)
        .join('\n');
      lines.push(`\n**📋 Berikutnya (${state.songs.length} lagu):**\n${upcoming}`);
    }

    const embed = createEmbed({
      title: '🎵 Antrean Musik',
      description: lines.join('\n'),
      color: COLORS.PRIMARY,
      footer: { text: `Autoplay: ${state.autoplay ? 'Aktif (ON)' : 'Nonaktif (OFF)'}` },
    });

    await interaction.reply({ embeds: [embed] });
  },
};
