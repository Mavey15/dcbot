const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { successEmbed, errorEmbed } = require('../../utils/embed');
const music = require('../../utils/musicManager');

module.exports = {
  category: 'Musik',
  cooldown: 2,
  data: new SlashCommandBuilder()
    .setName('resume')
    .setDescription('Lanjutkan kembali lagu yang dijeda'),
  async execute(interaction) {
    const ok = music.resume(interaction.guild.id);
    if (!ok) {
      return interaction.reply({
        embeds: [errorEmbed('Tidak Bisa Resume', 'Tidak ada lagu yang sedang dijeda saat ini.')],
        flags: MessageFlags.Ephemeral,
      });
    }

    await interaction.reply({
      embeds: [successEmbed('Musik Dilanjutkan', 'Pemutaran lagu dilanjutkan kembali.')],
    });
  },
};
