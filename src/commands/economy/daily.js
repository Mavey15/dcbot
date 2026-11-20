const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { successEmbed, warnEmbed } = require('../../utils/embed');
const { getAccount, updateAccount } = require('../../utils/economyStore');

const ONE_DAY = 24 * 60 * 60 * 1000;

module.exports = {
  category: 'Ekonomi',
  cooldown: 3,
  data: new SlashCommandBuilder()
    .setName('daily')
    .setDescription('Klaim hadiah koin harianmu (+ bonus streak!)'),
  async execute(interaction) {
    const now = Date.now();
    const acc = getAccount(interaction.guild.id, interaction.user.id);

    if (now - acc.lastDaily < ONE_DAY) {
      const nextTs = Math.floor((acc.lastDaily + ONE_DAY) / 1000);
      return interaction.reply({
        embeds: [warnEmbed('Sudah Klaim Hari Ini', `Kamu bisa klaim daily lagi <t:${nextTs}:R>.`)],
        flags: MessageFlags.Ephemeral,
      });
    }

    const isStreak = acc.lastDaily > 0 && now - acc.lastDaily <= ONE_DAY * 2;
    const newStreak = isStreak ? acc.dailyStreak + 1 : 1;
    const bonus = Math.min(newStreak * 50, 500);
    const reward = 250 + bonus;

    const updated = updateAccount(interaction.guild.id, interaction.user.id, (curr) => ({
      ...curr,
      balance: curr.balance + reward,
      lastDaily: now,
      dailyStreak: newStreak,
    }));

    await interaction.reply({
      embeds: [
        successEmbed(
          'Daily Berhasil Diklaim!',
          `Kamu mendapatkan **+${reward.toLocaleString('id-ID')} koin** (termasuk bonus streak **+${bonus}**).\n🔥 Streak: **${newStreak} hari**\n💰 Total saldo: **${updated.balance.toLocaleString('id-ID')} koin**`,
        ),
      ],
    });
  },
};
