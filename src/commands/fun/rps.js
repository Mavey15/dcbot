const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');
const { createEmbed, COLORS } = require('../../utils/embed');

const CHOICES = {
  batu: { label: 'Batu', emoji: '🪨', beats: 'gunting' },
  gunting: { label: 'Gunting', emoji: '✂️', beats: 'kertas' },
  kertas: { label: 'Kertas', emoji: '📄', beats: 'batu' },
};

module.exports = {
  category: 'Fun',
  cooldown: 3,
  data: new SlashCommandBuilder()
    .setName('rps')
    .setDescription('Main Gunting Batu Kertas melawan bot!'),
  async execute(interaction) {
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('batu').setLabel('Batu').setEmoji('🪨').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('gunting').setLabel('Gunting').setEmoji('✂️').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('kertas').setLabel('Kertas').setEmoji('📄').setStyle(ButtonStyle.Primary),
    );

    const startEmbed = createEmbed({
      title: '🎮 Gunting Batu Kertas',
      description: 'Pilih salah satu tombol di bawah dalam 30 detik!',
      color: COLORS.PRIMARY,
    });

    const response = await interaction.reply({
      embeds: [startEmbed],
      components: [row],
      withResponse: true,
    });

    const message = response.resource.message;

    try {
      const confirmation = await message.awaitMessageComponent({
        componentType: ComponentType.Button,
        filter: (i) => i.user.id === interaction.user.id,
        time: 30_000,
      });

      const userChoice = confirmation.customId;
      const keys = Object.keys(CHOICES);
      const botChoice = keys[Math.floor(Math.random() * keys.length)];

      let resultText;
      let color;
      if (userChoice === botChoice) {
        resultText = '🤝 **Seri!**';
        color = COLORS.WARNING;
      } else if (CHOICES[userChoice].beats === botChoice) {
        resultText = '🎉 **Kamu Menang!**';
        color = COLORS.SUCCESS;
      } else {
        resultText = '🤖 **Bot Menang!**';
        color = COLORS.ERROR;
      }

      const resultEmbed = createEmbed({
        title: '🎮 Hasil Gunting Batu Kertas',
        description: [
          `Kamu memilih: ${CHOICES[userChoice].emoji} **${CHOICES[userChoice].label}**`,
          `Bot memilih: ${CHOICES[botChoice].emoji} **${CHOICES[botChoice].label}**`,
          '',
          resultText,
        ].join('\n'),
        color,
      });

      await confirmation.update({ embeds: [resultEmbed], components: [] });
    } catch {
      const timeoutEmbed = createEmbed({
        title: '⏰ Waktu Habis',
        description: 'Permainan dibatalkan karena tidak ada pilihan dalam 30 detik.',
        color: COLORS.ERROR,
      });
      await interaction.editReply({ embeds: [timeoutEmbed], components: [] });
    }
  },
};
