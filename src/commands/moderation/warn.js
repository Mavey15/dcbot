const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const { createEmbed, successEmbed, warnEmbed, infoEmbed, COLORS } = require('../../utils/embed');
const { addWarning, getWarnings, clearWarnings } = require('../../utils/warningsStore');

module.exports = {
  category: 'Moderasi',
  cooldown: 3,
  data: new SlashCommandBuilder()
    .setName('warn')
    .setDescription('Kelola peringatan (warning) member')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addSubcommand((sub) =>
      sub
        .setName('add')
        .setDescription('Berikan peringatan ke member')
        .addUserOption((opt) => opt.setName('target').setDescription('Member target').setRequired(true))
        .addStringOption((opt) => opt.setName('alasan').setDescription('Alasan peringatan').setRequired(true)),
    )
    .addSubcommand((sub) =>
      sub
        .setName('list')
        .setDescription('Lihat daftar peringatan seorang member')
        .addUserOption((opt) => opt.setName('target').setDescription('Member target').setRequired(true)),
    )
    .addSubcommand((sub) =>
      sub
        .setName('clear')
        .setDescription('Hapus semua peringatan seorang member')
        .addUserOption((opt) => opt.setName('target').setDescription('Member target').setRequired(true)),
    ),
  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();
    const target = interaction.options.getUser('target');
    const guildId = interaction.guild.id;

    if (subcommand === 'add') {
      const reason = interaction.options.getString('alasan');
      const { total } = addWarning(guildId, target.id, interaction.user.id, reason);

      return interaction.reply({
        embeds: [
          warnEmbed(
            'Peringatan Diberikan',
            `**${target.tag}** menerima peringatan ke-**${total}**.\n**Alasan:** ${reason}\n**Moderator:** ${interaction.user}`,
          ),
        ],
      });
    }

    if (subcommand === 'list') {
      const warnings = getWarnings(guildId, target.id);
      if (warnings.length === 0) {
        return interaction.reply({
          embeds: [infoEmbed('Daftar Peringatan', `**${target.tag}** tidak memiliki peringatan.`)],
          flags: MessageFlags.Ephemeral,
        });
      }

      const lines = warnings.map((w, idx) => {
        const ts = Math.floor(new Date(w.timestamp).getTime() / 1000);
        return `**#${idx + 1}** • ${w.reason}\n↳ Oleh <@${w.moderatorId}> pada <t:${ts}:d>`;
      });

      const embed = createEmbed({
        title: `⚠️ Peringatan: ${target.tag} (${warnings.length})`,
        description: lines.join('\n\n'),
        color: COLORS.WARNING,
      });

      return interaction.reply({ embeds: [embed] });
    }

    if (subcommand === 'clear') {
      const cleared = clearWarnings(guildId, target.id);
      return interaction.reply({
        embeds: [
          cleared
            ? successEmbed('Peringatan Dihapus', `Semua peringatan untuk **${target.tag}** telah dibersihkan.`)
            : infoEmbed('Tidak Ada Data', `**${target.tag}** memang tidak memiliki peringatan.`),
        ],
      });
    }
  },
};
