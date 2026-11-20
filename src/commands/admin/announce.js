const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChannelType,
  MessageFlags,
} = require('discord.js');
const { createEmbed, successEmbed, COLORS } = require('../../utils/embed');

module.exports = {
  category: 'Admin & Setup',
  cooldown: 5,
  data: new SlashCommandBuilder()
    .setName('announce')
    .setDescription('Kirim pengumuman rapi dengan Embed ke channel pilihan')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addStringOption((opt) => opt.setName('judul').setDescription('Judul pengumuman').setRequired(true))
    .addStringOption((opt) => opt.setName('isi').setDescription('Isi pengumuman').setRequired(true))
    .addChannelOption((opt) =>
      opt
        .setName('channel')
        .setDescription('Channel tujuan (kosongkan untuk channel ini)')
        .addChannelTypes(ChannelType.GuildText),
    )
    .addBooleanOption((opt) =>
      opt.setName('mention_everyone').setDescription('Tag @everyone pada pengumuman ini?'),
    ),
  async execute(interaction) {
    const title = interaction.options.getString('judul');
    const body = interaction.options.getString('isi');
    const channel = interaction.options.getChannel('channel') || interaction.channel;
    const mentionEveryone = interaction.options.getBoolean('mention_everyone') || false;

    const embed = createEmbed({
      title: `📢 ${title}`,
      description: body,
      color: COLORS.PRIMARY,
      footer: {
        text: `Pengumuman oleh ${interaction.user.tag}`,
        iconURL: interaction.user.displayAvatarURL({ size: 64 }),
      },
    });

    await channel.send({
      content: mentionEveryone ? '@everyone' : undefined,
      embeds: [embed],
    });

    await interaction.reply({
      embeds: [successEmbed('Pengumuman Terkirim', `Pengumuman berhasil dikirim ke ${channel}.`)],
      flags: MessageFlags.Ephemeral,
    });
  },
};
