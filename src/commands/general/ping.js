const { SlashCommandBuilder } = require('discord.js');
const { createEmbed, COLORS } = require('../../utils/embed');

module.exports = {
  category: 'Umum',
  cooldown: 3,
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Cek kecepatan respon (latency) bot'),
  async execute(interaction) {
    const response = await interaction.reply({ content: '🏓 Mengukur latency...', withResponse: true });
    const roundtrip = response.resource.message.createdTimestamp - interaction.createdTimestamp;
    const wsPing = interaction.client.ws.ping;

    const embed = createEmbed({
      title: '🏓 Pong!',
      color: COLORS.SUCCESS,
      fields: [
        { name: 'Roundtrip Latency', value: `\`${roundtrip}ms\``, inline: true },
        { name: 'WebSocket Ping', value: `\`${wsPing}ms\``, inline: true },
      ],
    });

    await interaction.editReply({ content: '', embeds: [embed] });
  },
};
