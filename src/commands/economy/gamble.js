const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { successEmbed, errorEmbed } = require('../../utils/embed');
const { getAccount, updateAccount } = require('../../utils/economyStore');

module.exports = {
  category: 'Ekonomi',
  cooldown: 5,
  data: new SlashCommandBuilder()
    .setName('gamble')
    .setDescription('Adu keberuntungan dengan taruhan koinmu!')
    .addIntegerOption((opt) =>
      opt.setName('taruhan').setDescription('Jumlah koin yang dipertaruhkan').setMinValue(10).setRequired(true),
    ),
  async execute(interaction) {
    const bet = interaction.options.getInteger('taruhan');
    const acc = getAccount(interaction.guild.id, interaction.user.id);

    if (acc.balance < bet) {
      return interaction.reply({
        embeds: [errorEmbed('Saldo Tidak Cukup', `Saldomu hanya **${acc.balance.toLocaleString('id-ID')} koin**.`)],
        flags: MessageFlags.Ephemeral,
      });
    }

    const roll = Math.random();
    if (roll < 0.08) {
      // Jackpot 3x
      const profit = bet * 2;
      const updated = updateAccount(interaction.guild.id, interaction.user.id, (c) => ({
        ...c,
        balance: c.balance + profit,
      }));
      return interaction.reply({
        embeds: [
          successEmbed(
            '🎰 JACKPOT 3x!',
            `Luar biasa! Kamu menang **+${profit.toLocaleString('id-ID')} koin**!\n💰 Saldo: **${updated.balance.toLocaleString('id-ID')} koin**`,
          ),
        ],
      });
    }

    if (roll < 0.5) {
      // Menang 2x
      const updated = updateAccount(interaction.guild.id, interaction.user.id, (c) => ({
        ...c,
        balance: c.balance + bet,
      }));
      return interaction.reply({
        embeds: [
          successEmbed(
            '🎉 Kamu Menang!',
            `Kamu mendapatkan **+${bet.toLocaleString('id-ID')} koin**!\n💰 Saldo: **${updated.balance.toLocaleString('id-ID')} koin**`,
          ),
        ],
      });
    }

    // Kalah
    const updated = updateAccount(interaction.guild.id, interaction.user.id, (c) => ({
      ...c,
      balance: c.balance - bet,
    }));
    return interaction.reply({
      embeds: [
        errorEmbed(
          '💸 Kurang Beruntung!',
          `Kamu kehilangan **-${bet.toLocaleString('id-ID')} koin**.\n💰 Sisa saldo: **${updated.balance.toLocaleString('id-ID')} koin**`,
        ),
      ],
    });
  },
};
