const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { successEmbed, warnEmbed } = require('../../utils/embed');
const { getAccount, updateAccount } = require('../../utils/economyStore');

const WORK_COOLDOWN = 10 * 60 * 1000; // 10 menit
const JOBS = [
  'membuat website klien',
  'mengantar paket seharian',
  'menjadi barista di kafe',
  'memperbaiki bug di server',
  'mendesain logo untuk streamer',
  'menjual kopi susu kekinian',
];

module.exports = {
  category: 'Ekonomi',
  cooldown: 3,
  data: new SlashCommandBuilder()
    .setName('work')
    .setDescription('Bekerja untuk mendapatkan koin (cooldown 10 menit)'),
  async execute(interaction) {
    const now = Date.now();
    const acc = getAccount(interaction.guild.id, interaction.user.id);

    if (now - acc.lastWork < WORK_COOLDOWN) {
      const nextTs = Math.floor((acc.lastWork + WORK_COOLDOWN) / 1000);
      return interaction.reply({
        embeds: [warnEmbed('Istirahat Dulu', `Kamu baru saja bekerja! Bisa kerja lagi <t:${nextTs}:R>.`)],
        flags: MessageFlags.Ephemeral,
      });
    }

    const earned = Math.floor(Math.random() * 151) + 100; // 100–250 koin
    const job = JOBS[Math.floor(Math.random() * JOBS.length)];

    const updated = updateAccount(interaction.guild.id, interaction.user.id, (curr) => ({
      ...curr,
      balance: curr.balance + earned,
      lastWork: now,
    }));

    await interaction.reply({
      embeds: [
        successEmbed(
          'Gaji Masuk!',
          `Kamu selesai **${job}** dan mendapatkan **+${earned.toLocaleString('id-ID')} koin**!\n💰 Total saldo: **${updated.balance.toLocaleString('id-ID')} koin**`,
        ),
      ],
    });
  },
};
