const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const { successEmbed, errorEmbed } = require('../../utils/embed');

module.exports = {
  category: 'Moderasi',
  cooldown: 5,
  data: new SlashCommandBuilder()
    .setName('clear')
    .setDescription('Menghapus sejumlah pesan di channel ini (maks 100)')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addIntegerOption((opt) =>
      opt
        .setName('jumlah')
        .setDescription('Jumlah pesan yang akan dihapus (1–100)')
        .setMinValue(1)
        .setMaxValue(100)
        .setRequired(true),
    ),
  async execute(interaction) {
    const amount = interaction.options.getInteger('jumlah');

    try {
      const deleted = await interaction.channel.bulkDelete(amount, true);
      await interaction.reply({
        embeds: [
          successEmbed(
            'Pesan Dihapus',
            `Berhasil menghapus **${deleted.size}** pesan. *(Pesan lebih dari 14 hari tidak dapat dihapus massal oleh Discord)*`,
          ),
        ],
        flags: MessageFlags.Ephemeral,
      });
    } catch {
      await interaction.reply({
        embeds: [errorEmbed('Gagal Menghapus', 'Pastikan bot memiliki izin `Manage Messages` di channel ini.')],
        flags: MessageFlags.Ephemeral,
      });
    }
  },
};
