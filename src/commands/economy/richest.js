const { SlashCommandBuilder } = require('discord.js');
const { createEmbed, infoEmbed, COLORS } = require('../../utils/embed');
const { getRichest } = require('../../utils/economyStore');

const MEDALS = ['🥇', '🥈', '🥉'];

module.exports = {
  category: 'Ekonomi',
  cooldown: 5,
  data: new SlashCommandBuilder()
    .setName('richest')
    .setDescription('Lihat Top 10 member terkaya di server'),
  async execute(interaction) {
    const top = getRichest(interaction.guild.id, 10);
    if (top.length === 0) {
      return interaction.reply({
        embeds: [infoEmbed('Belum Ada Data', 'Gunakan `/daily` atau `/work` untuk mulai mengumpulkan koin!')],
      });
    }

    const lines = top.map((u, idx) => {
      const prefix = MEDALS[idx] || `**#${idx + 1}**`;
      return `${prefix} <@${u.userId}> — **${u.balance.toLocaleString('id-ID')} koin**`;
    });

    const embed = createEmbed({
      title: `💎 Leaderboard Sultan: ${interaction.guild.name}`,
      description: lines.join('\n'),
      color: COLORS.SUCCESS,
    });

    await interaction.reply({ embeds: [embed] });
  },
};
