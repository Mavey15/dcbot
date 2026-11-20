const { SlashCommandBuilder } = require('discord.js');
const { createEmbed, COLORS } = require('../../utils/embed');
const { getAccount } = require('../../utils/economyStore');

module.exports = {
  category: 'Ekonomi',
  cooldown: 2,
  data: new SlashCommandBuilder()
    .setName('balance')
    .setDescription('Cek saldo koin milikmu atau member lain')
    .addUserOption((opt) => opt.setName('target').setDescription('Member yang ingin dicek saldonya')),
  async execute(interaction) {
    const user = interaction.options.getUser('target') || interaction.user;
    const acc = getAccount(interaction.guild.id, user.id);

    const embed = createEmbed({
      title: `💰 Saldo: ${user.username}`,
      color: COLORS.SUCCESS,
      thumbnail: user.displayAvatarURL({ size: 128 }),
      fields: [
        { name: '🪙 Koin', value: `**${acc.balance.toLocaleString('id-ID')}** koin`, inline: true },
        { name: '🔥 Daily Streak', value: `${acc.dailyStreak} hari`, inline: true },
      ],
    });

    await interaction.reply({ embeds: [embed] });
  },
};
