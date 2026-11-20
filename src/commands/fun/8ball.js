const { SlashCommandBuilder } = require('discord.js');
const { createEmbed, COLORS } = require('../../utils/embed');

const ANSWERS = [
  'Ya, pasti!',
  'Kemungkinan besar ya.',
  'Tanpa ragu lagi.',
  'Kelihatannya bagus.',
  'Coba tanya lagi nanti.',
  'Sulit diprediksi sekarang.',
  'Jangan terlalu berharap.',
  'Sepertinya tidak.',
  'Sangat diragukan.',
  'Tidak mungkin!',
];

module.exports = {
  category: 'Fun',
  cooldown: 3,
  data: new SlashCommandBuilder()
    .setName('8ball')
    .setDescription('Tanyakan sesuatu pada bola ajaib 8-Ball')
    .addStringOption((opt) =>
      opt.setName('pertanyaan').setDescription('Pertanyaan yang ingin kamu tanyakan').setRequired(true),
    ),
  async execute(interaction) {
    const question = interaction.options.getString('pertanyaan');
    const answer = ANSWERS[Math.floor(Math.random() * ANSWERS.length)];

    const embed = createEmbed({
      title: '🎱 Bola Ajaib 8-Ball',
      color: COLORS.PRIMARY,
      fields: [
        { name: '❓ Pertanyaan', value: question },
        { name: '🔮 Jawaban', value: `**${answer}**` },
      ],
    });

    await interaction.reply({ embeds: [embed] });
  },
};
