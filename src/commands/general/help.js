const { SlashCommandBuilder } = require('discord.js');
const { createEmbed, COLORS } = require('../../utils/embed');

module.exports = {
  category: 'Umum',
  cooldown: 3,
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Menampilkan daftar semua perintah bot yang tersedia'),
  async execute(interaction) {
    const categories = new Map();

    for (const command of interaction.client.commands.values()) {
      const cat = command.category || 'Lainnya';
      if (!categories.has(cat)) categories.set(cat, []);
      categories.get(cat).push(`\`/${command.data.name}\` — ${command.data.description}`);
    }

    const fields = [];
    for (const [category, list] of categories.entries()) {
      fields.push({
        name: `📁 ${category}`,
        value: list.sort().join('\n'),
        inline: false,
      });
    }

    const embed = createEmbed({
      title: '📖 Daftar Perintah Bot',
      description: `Total **${interaction.client.commands.size}** perintah tersedia. Ketik \`/\` untuk mulai menggunakan perintah!`,
      color: COLORS.PRIMARY,
      fields,
      footer: { text: `Diminta oleh ${interaction.user.tag}` },
    });

    await interaction.reply({ embeds: [embed] });
  },
};
