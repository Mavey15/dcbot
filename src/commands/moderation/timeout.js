const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const { successEmbed, errorEmbed } = require('../../utils/embed');

module.exports = {
  category: 'Moderasi',
  cooldown: 3,
  data: new SlashCommandBuilder()
    .setName('timeout')
    .setDescription('Memberikan mute/timeout sementara ke member')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption((opt) => opt.setName('target').setDescription('Member yang akan di-timeout').setRequired(true))
    .addIntegerOption((opt) =>
      opt
        .setName('menit')
        .setDescription('Durasi timeout dalam menit (1–40320, atau 0 untuk lepas timeout)')
        .setMinValue(0)
        .setMaxValue(40320)
        .setRequired(true),
    )
    .addStringOption((opt) => opt.setName('alasan').setDescription('Alasan timeout')),
  async execute(interaction) {
    const user = interaction.options.getUser('target');
    const minutes = interaction.options.getInteger('menit');
    const reason = interaction.options.getString('alasan') || 'Tidak ada alasan diberikan';
    const member = await interaction.guild.members.fetch(user.id).catch(() => null);

    if (!member) {
      return interaction.reply({
        embeds: [errorEmbed('Member Tidak Ditemukan', 'User tersebut tidak berada di server ini.')],
        flags: MessageFlags.Ephemeral,
      });
    }

    if (!member.moderatable) {
      return interaction.reply({
        embeds: [errorEmbed('Tidak Bisa Timeout', 'Role bot terlalu rendah atau target memiliki izin lebih tinggi.')],
        flags: MessageFlags.Ephemeral,
      });
    }

    if (minutes === 0) {
      await member.timeout(null, reason);
      return interaction.reply({
        embeds: [successEmbed('Timeout Dilepas', `Timeout untuk **${user.tag}** telah dilepas.`)],
      });
    }

    await member.timeout(minutes * 60 * 1000, reason);
    await interaction.reply({
      embeds: [
        successEmbed(
          'Member Di-timeout',
          `**${user.tag}** di-timeout selama **${minutes} menit**.\n**Alasan:** ${reason}\n**Moderator:** ${interaction.user}`,
        ),
      ],
    });
  },
};
