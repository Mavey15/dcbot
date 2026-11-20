const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { successEmbed, errorEmbed } = require('../../utils/embed');
const { getAccount, updateAccount } = require('../../utils/economyStore');

module.exports = {
  category: 'Ekonomi',
  cooldown: 3,
  data: new SlashCommandBuilder()
    .setName('give')
    .setDescription('Transfer koin ke member lain')
    .addUserOption((opt) => opt.setName('target').setDescription('Penerima koin').setRequired(true))
    .addIntegerOption((opt) =>
      opt.setName('jumlah').setDescription('Jumlah koin yang dikirim').setMinValue(1).setRequired(true),
    ),
  async execute(interaction) {
    const target = interaction.options.getUser('target');
    const amount = interaction.options.getInteger('jumlah');

    if (target.id === interaction.user.id || target.bot) {
      return interaction.reply({
        embeds: [errorEmbed('Target Tidak Valid', 'Kamu tidak bisa mengirim koin ke diri sendiri atau ke bot.')],
        flags: MessageFlags.Ephemeral,
      });
    }

    const sender = getAccount(interaction.guild.id, interaction.user.id);
    if (sender.balance < amount) {
      return interaction.reply({
        embeds: [errorEmbed('Saldo Kurang', `Saldomu hanya **${sender.balance.toLocaleString('id-ID')} koin**.`)],
        flags: MessageFlags.Ephemeral,
      });
    }

    updateAccount(interaction.guild.id, interaction.user.id, (c) => ({ ...c, balance: c.balance - amount }));
    updateAccount(interaction.guild.id, target.id, (c) => ({ ...c, balance: c.balance + amount }));

    await interaction.reply({
      embeds: [
        successEmbed(
          'Transfer Berhasil',
          `${interaction.user} mengirim **${amount.toLocaleString('id-ID')} koin** ke ${target}!`,
        ),
      ],
    });
  },
};
