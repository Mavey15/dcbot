const { SlashCommandBuilder } = require('discord.js');
const { infoEmbed } = require('../../utils/embed');
const { setAfk } = require('../../utils/afkStore');

module.exports = {
  category: 'Umum',
  cooldown: 3,
  data: new SlashCommandBuilder()
    .setName('afk')
    .setDescription('Set status AFK (otomatis memberi tahu orang yang mention kamu)')
    .addStringOption((opt) => opt.setName('alasan').setDescription('Alasan AFK (opsional)')),
  async execute(interaction) {
    const reason = interaction.options.getString('alasan') || 'Sedang AFK';
    setAfk(interaction.guild.id, interaction.user.id, reason);

    await interaction.reply({
      embeds: [
        infoEmbed('💤 Status AFK Aktif', `${interaction.user} sekarang sedang AFK.\n**Alasan:** ${reason}`),
      ],
    });
  },
};
