const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
} = require('discord.js');
const { createEmbed, successEmbed, COLORS } = require('../../utils/embed');

module.exports = {
  category: 'Admin & Setup',
  cooldown: 5,
  data: new SlashCommandBuilder()
    .setName('rolepanel')
    .setDescription('Buat panel tombol ambil role sendiri (Self-Roles, hingga 5 role)')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    .addStringOption((opt) => opt.setName('judul').setDescription('Judul panel role').setRequired(true))
    .addRoleOption((opt) => opt.setName('role1').setDescription('Role 1').setRequired(true))
    .addRoleOption((opt) => opt.setName('role2').setDescription('Role 2 (opsional)'))
    .addRoleOption((opt) => opt.setName('role3').setDescription('Role 3 (opsional)'))
    .addRoleOption((opt) => opt.setName('role4').setDescription('Role 4 (opsional)'))
    .addRoleOption((opt) => opt.setName('role5').setDescription('Role 5 (opsional)'))
    .addStringOption((opt) => opt.setName('deskripsi').setDescription('Deskripsi tambahan (opsional)')),
  async execute(interaction) {
    const title = interaction.options.getString('judul');
    const description =
      interaction.options.getString('deskripsi') ||
      'Klik tombol di bawah untuk mengambil atau melepas role sesuai pilihanmu!';

    const roles = ['role1', 'role2', 'role3', 'role4', 'role5']
      .map((k) => interaction.options.getRole(k))
      .filter(Boolean);

    const row = new ActionRowBuilder().addComponents(
      roles.map((role) =>
        new ButtonBuilder()
          .setCustomId(`selfrole_${role.id}`)
          .setLabel(role.name.slice(0, 80))
          .setStyle(ButtonStyle.Secondary),
      ),
    );

    const roleList = roles.map((r) => `• ${r}`).join('\n');
    const embed = createEmbed({
      title: `🎭 ${title}`,
      description: `${description}\n\n**Role Tersedia:**\n${roleList}`,
      color: COLORS.PRIMARY,
    });

    await interaction.channel.send({ embeds: [embed], components: [row] });
    await interaction.reply({
      embeds: [successEmbed('Panel Role Dibuat', 'Member sekarang bisa klik tombol untuk ambil/lepas role.')],
      flags: MessageFlags.Ephemeral,
    });
  },
};
