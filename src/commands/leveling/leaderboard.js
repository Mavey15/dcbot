const { SlashCommandBuilder } = require('discord.js');
const { createEmbed, infoEmbed, COLORS } = require('../../utils/embed');
const { getLeaderboard } = require('../../utils/levelStore');

const MEDALS = ['🥇', '🥈', '🥉'];

module.exports = {
  category: 'Leveling',
  cooldown: 5,
  data: new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('Lihat Top 10 member dengan level tertinggi di server'),
  async execute(interaction) {
    const top = getLeaderboard(interaction.guild.id, 10);
    if (top.length === 0) {
      return interaction.reply({
        embeds: [infoEmbed('Leaderboard Kosong', 'Belum ada member yang mengumpulkan XP. Mulai chatting untuk naik level!')],
      });
    }

    const lines = top.map((u, idx) => {
      const prefix = MEDALS[idx] || `**#${idx + 1}**`;
      return `${prefix} <@${u.userId}> — **Level ${u.level}** (\`${u.xp} XP\`)`;
    });

    const embed = createEmbed({
      title: `🏆 Leaderboard Level: ${interaction.guild.name}`,
      description: lines.join('\n'),
      color: COLORS.WARNING,
    });

    await interaction.reply({ embeds: [embed] });
  },
};
