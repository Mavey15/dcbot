const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const { successEmbed, errorEmbed } = require('../../utils/embed');

module.exports = {
  category: 'Moderasi',
  cooldown: 3,
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Mem-ban member dari server')
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .addUserOption((opt) => opt.setName('target').setDescription('Member yang akan di-ban').setRequired(true))
    .addStringOption((opt) => opt.setName('alasan').setDescription('Alasan ban')),
  async execute(interaction) {
    const user = interaction.options.getUser('target');
    const reason = interaction.options.getString('alasan') || 'Tidak ada alasan diberikan';
    const member = await interaction.guild.members.fetch(user.id).catch(() => null);

    if (member && !member.bannable) {
      return interaction.reply({
        embeds: [errorEmbed('Tidak Bisa Ban', 'Role bot terlalu rendah atau target memiliki izin lebih tinggi.')],
        flags: MessageFlags.Ephemeral,
      });
    }

    await interaction.guild.members.ban(user.id, { reason });
    await interaction.reply({
      embeds: [
        successEmbed(
          'Member Di-ban',
          `**${user.tag}** telah di-ban dari server.\n**Alasan:** ${reason}\n**Moderator:** ${interaction.user}`,
        ),
      ],
    });
  },
};
