const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const { successEmbed, errorEmbed } = require('../../utils/embed');

module.exports = {
  category: 'Moderasi',
  cooldown: 3,
  data: new SlashCommandBuilder()
    .setName('slowmode')
    .setDescription('Atur slowmode (jeda kirim pesan) di channel ini')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addIntegerOption((opt) =>
      opt
        .setName('detik')
        .setDescription('Jeda dalam detik (0 untuk mematikan, maks 21600)')
        .setMinValue(0)
        .setMaxValue(21600)
        .setRequired(true),
    ),
  async execute(interaction) {
    const seconds = interaction.options.getInteger('detik');

    try {
      await interaction.channel.setRateLimitPerUser(seconds);
      const msg =
        seconds === 0
          ? 'Slowmode di channel ini telah **dimatikan**.'
          : `Slowmode di channel ini diatur ke **${seconds} detik**.`;

      await interaction.reply({ embeds: [successEmbed('Slowmode Diperbarui', msg)] });
    } catch {
      await interaction.reply({
        embeds: [errorEmbed('Gagal Mengatur Slowmode', 'Pastikan bot memiliki izin `Manage Channels`.')],
        flags: MessageFlags.Ephemeral,
      });
    }
  },
};
