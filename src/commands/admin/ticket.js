const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  MessageFlags,
} = require('discord.js');
const { createEmbed, successEmbed, COLORS } = require('../../utils/embed');

module.exports = {
  category: 'Admin & Setup',
  cooldown: 5,
  data: new SlashCommandBuilder()
    .setName('ticket')
    .setDescription('Kirim panel Ticket Support interaktif')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addSubcommand((sub) =>
      sub
        .setName('panel')
        .setDescription('Kirim panel tombol Buat Tiket ke channel')
        .addStringOption((opt) =>
          opt.setName('judul').setDescription('Judul panel tiket (opsional)'),
        )
        .addStringOption((opt) =>
          opt.setName('deskripsi').setDescription('Deskripsi panel tiket (opsional)'),
        )
        .addChannelOption((opt) =>
          opt
            .setName('channel')
            .setDescription('Channel tujuan (kosongkan untuk channel ini)')
            .addChannelTypes(ChannelType.GuildText),
        ),
    ),
  async execute(interaction) {
    const title = interaction.options.getString('judul') || '🎫 Pusat Bantuan / Ticket Support';
    const description =
      interaction.options.getString('deskripsi') ||
      'Butuh bantuan, ingin melapor, atau menghubungi admin?\nKlik tombol **Buat Tiket** di bawah untuk membuka channel privat bersama staff.';
    const targetChannel = interaction.options.getChannel('channel') || interaction.channel;

    const embed = createEmbed({
      title,
      description,
      color: COLORS.PRIMARY,
      footer: { text: `${interaction.guild.name} • Ticket System` },
    });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('ticket_create')
        .setLabel('Buat Tiket')
        .setEmoji('🎫')
        .setStyle(ButtonStyle.Primary),
    );

    await targetChannel.send({ embeds: [embed], components: [row] });
    await interaction.reply({
      embeds: [successEmbed('Panel Tiket Terkirim', `Panel tiket berhasil dikirim ke ${targetChannel}.`)],
      flags: MessageFlags.Ephemeral,
    });
  },
};
