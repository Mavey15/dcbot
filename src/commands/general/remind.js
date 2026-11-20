const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { successEmbed, errorEmbed, infoEmbed } = require('../../utils/embed');

function parseDuration(input) {
  const match = input.trim().toLowerCase().match(/^(\d+)\s*(s|m|h|d)$/);
  if (!match) return null;

  const value = parseInt(match[1], 10);
  const unit = match[2];
  const multipliers = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };

  return value * multipliers[unit];
}

module.exports = {
  category: 'Umum',
  cooldown: 5,
  data: new SlashCommandBuilder()
    .setName('remind')
    .setDescription('Buat pengingat otomatis (contoh waktu: 10s, 5m, 1h)')
    .addStringOption((opt) =>
      opt.setName('waktu').setDescription('Durasi pengingat (contoh: 30s, 10m, 2h)').setRequired(true),
    )
    .addStringOption((opt) =>
      opt.setName('pesan').setDescription('Apa yang ingin diingatkan?').setRequired(true),
    ),
  async execute(interaction) {
    const timeStr = interaction.options.getString('waktu');
    const message = interaction.options.getString('pesan');
    const ms = parseDuration(timeStr);

    if (!ms || ms < 5000 || ms > 7 * 24 * 60 * 60 * 1000) {
      return interaction.reply({
        embeds: [
          errorEmbed(
            'Format Waktu Tidak Valid',
            'Gunakan format seperti `10s`, `5m`, `1h`, atau `1d` (minimal 5 detik, maksimal 7 hari).',
          ),
        ],
        flags: MessageFlags.Ephemeral,
      });
    }

    const targetTs = Math.floor((Date.now() + ms) / 1000);
    await interaction.reply({
      embeds: [
        successEmbed(
          'Pengingat Disetel',
          `Saya akan mengingatkanmu <t:${targetTs}:R> (<t:${targetTs}:T>):\n> ${message}`,
        ),
      ],
    });

    setTimeout(async () => {
      const reminderEmbed = infoEmbed('⏰ Waktunya Pengingat!', `Kamu meminta diingatkan tentang:\n> ${message}`);
      try {
        await interaction.followUp({ content: `${interaction.user}`, embeds: [reminderEmbed] });
      } catch {
        await interaction.user.send({ embeds: [reminderEmbed] }).catch(() => {});
      }
    }, ms);
  },
};
