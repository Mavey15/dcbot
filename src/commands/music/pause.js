const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { successEmbed, errorEmbed } = require('../../utils/embed');
const music = require('../../utils/musicManager');

module.exports = {
  category: 'Musik',
  cooldown: 2,
  data: new SlashCommandBuilder()
    .setName('pause')
    .setDescription('Jeda sementara lagu yang sedang diputar'),
  async execute(interaction) {
    const ok = music.pause(interaction.guild.id);
    if (!ok) {
      return interaction.reply({
        embeds: [errorEmbed('Tidak Bisa Pause', 'Tidak ada lagu yang sedang diputar saat ini.')],
        flags: MessageFlags.Ephemeral,
      });
    }

    await interaction.reply({
      embeds: [successEmbed('Musik Dijeda', 'Gunakan `/resume` untuk melanjutkan pemutaran.')],
    });
  },
};
