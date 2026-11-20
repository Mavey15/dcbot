const { SlashCommandBuilder } = require('discord.js');
const { createEmbed, COLORS } = require('../../utils/embed');

const NUMBER_EMOJIS = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣'];

module.exports = {
  category: 'Umum',
  cooldown: 5,
  data: new SlashCommandBuilder()
    .setName('poll')
    .setDescription('Membuat polling dengan reaksi otomatis')
    .addStringOption((opt) =>
      opt.setName('pertanyaan').setDescription('Pertanyaan polling').setRequired(true),
    )
    .addStringOption((opt) =>
      opt.setName('pilihan1').setDescription('Pilihan 1').setRequired(true),
    )
    .addStringOption((opt) =>
      opt.setName('pilihan2').setDescription('Pilihan 2').setRequired(true),
    )
    .addStringOption((opt) => opt.setName('pilihan3').setDescription('Pilihan 3 (opsional)'))
    .addStringOption((opt) => opt.setName('pilihan4').setDescription('Pilihan 4 (opsional)'))
    .addStringOption((opt) => opt.setName('pilihan5').setDescription('Pilihan 5 (opsional)')),
  async execute(interaction) {
    const question = interaction.options.getString('pertanyaan');
    const choices = ['pilihan1', 'pilihan2', 'pilihan3', 'pilihan4', 'pilihan5']
      .map((name) => interaction.options.getString(name))
      .filter(Boolean);

    const description = choices.map((choice, i) => `${NUMBER_EMOJIS[i]} ${choice}`).join('\n\n');

    const embed = createEmbed({
      title: `📊 ${question}`,
      description,
      color: COLORS.PRIMARY,
      footer: { text: `Polling dibuat oleh ${interaction.user.tag}` },
    });

    const response = await interaction.reply({ embeds: [embed], withResponse: true });
    const message = response.resource.message;

    for (let i = 0; i < choices.length; i++) {
      await message.react(NUMBER_EMOJIS[i]).catch(() => {});
    }
  },
};
