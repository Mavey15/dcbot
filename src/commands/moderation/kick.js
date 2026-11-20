const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const { successEmbed, errorEmbed } = require('../../utils/embed');

module.exports = {
  category: 'Moderasi',
  cooldown: 3,
  data: new SlashCommandBuilder()
    .setName('kick')
    .setDescription('Mengeluarkan member dari server')
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
    .addUserOption((opt) => opt.setName('target').setDescription('Member yang akan di-kick').setRequired(true))
    .addStringOption((opt) => opt.setName('alasan').setDescription('Alasan kick')),
  async execute(interaction) {
    const user = interaction.options.getUser('target');
    const reason = interaction.options.getString('alasan') || 'Tidak ada alasan diberikan';
    const member = await interaction.guild.members.fetch(user.id).catch(() => null);

    if (!member) {
      return interaction.reply({
        embeds: [errorEmbed('Member Tidak Ditemukan', 'User tersebut tidak berada di server ini.')],
        flags: MessageFlags.Ephemeral,
      });
    }

    if (!member.kickable) {
      return interaction.reply({
        embeds: [errorEmbed('Tidak Bisa Kick', 'Role bot terlalu rendah atau target memiliki izin lebih tinggi.')],
        flags: MessageFlags.Ephemeral,
      });
    }

    await member.kick(reason);
    await interaction.reply({
      embeds: [
        successEmbed(
          'Member Di-kick',
          `**${user.tag}** telah dikeluarkan dari server.\n**Alasan:** ${reason}\n**Moderator:** ${interaction.user}`,
        ),
      ],
    });
  },
};
