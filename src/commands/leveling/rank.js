const { SlashCommandBuilder } = require('discord.js');
const { createEmbed, COLORS } = require('../../utils/embed');
const { getUserRank } = require('../../utils/levelStore');

function buildProgressBar(current, total, size = 12) {
  const ratio = Math.max(0, Math.min(1, current / Math.max(1, total)));
  const filled = Math.round(ratio * size);
  return '🟦'.repeat(filled) + '⬜'.repeat(size - filled);
}

module.exports = {
  category: 'Leveling',
  cooldown: 3,
  data: new SlashCommandBuilder()
    .setName('rank')
    .setDescription('Lihat level, XP, dan peringkat member di server')
    .addUserOption((opt) => opt.setName('target').setDescription('Member yang ingin dilihat rank-nya')),
  async execute(interaction) {
    const user = interaction.options.getUser('target') || interaction.user;
    const stats = getUserRank(interaction.guild.id, user.id);
    const bar = buildProgressBar(stats.xp, stats.needed);

    const embed = createEmbed({
      title: `🏆 Rank: ${user.username}`,
      color: COLORS.PRIMARY,
      thumbnail: user.displayAvatarURL({ size: 256 }),
      fields: [
        { name: '🥇 Peringkat', value: `#${stats.rank}`, inline: true },
        { name: '⭐ Level', value: `${stats.level}`, inline: true },
        { name: '💬 Pesan', value: `${stats.messages}`, inline: true },
        {
          name: `📊 Progress XP (${stats.xp} / ${stats.needed})`,
          value: `${bar} \`${Math.floor((stats.xp / stats.needed) * 100)}%\``,
          inline: false,
        },
      ],
    });

    await interaction.reply({ embeds: [embed] });
  },
};
