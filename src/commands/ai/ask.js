const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { createEmbed, errorEmbed, COLORS } = require('../../utils/embed');
const { askGemini } = require('../../utils/aiClient');

module.exports = {
  category: 'AI',
  cooldown: 4,
  data: new SlashCommandBuilder()
    .setName('ask')
    .setDescription('Tanyakan apa saja ke AI (Google Gemini)')
    .addStringOption((opt) =>
      opt.setName('pertanyaan').setDescription('Pertanyaan untuk AI').setRequired(true),
    ),
  async execute(interaction) {
    if (!process.env.GEMINI_API_KEY) {
      return interaction.reply({
        embeds: [
          errorEmbed(
            'AI Belum Dikonfigurasi',
            'Fitur AI membutuhkan `GEMINI_API_KEY` di file `.env`.\nDapatkan API key gratis di https://aistudio.google.com/apikey lalu restart bot.',
          ),
        ],
        flags: MessageFlags.Ephemeral,
      });
    }

    const prompt = interaction.options.getString('pertanyaan');
    await interaction.deferReply();

    try {
      const replyText = await askGemini(prompt, interaction.channelId);
      const trimmed = replyText.length > 3900 ? `${replyText.slice(0, 3900)}...` : replyText;

      const embed = createEmbed({
        title: '✨ Jawaban AI',
        description: trimmed,
        color: COLORS.PRIMARY,
        footer: { text: `Pertanyaan: ${prompt.slice(0, 100)}` },
      });

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error('Error Gemini API:', error);
      await interaction.editReply({
        embeds: [
          errorEmbed(
            'Gagal Menghubungi AI',
            'Pastikan `GEMINI_API_KEY` valid dan koneksi internet tersedia.',
          ),
        ],
      });
    }
  },
};
