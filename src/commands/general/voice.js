const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const { successEmbed, errorEmbed } = require('../../utils/embed');

module.exports = {
  category: 'Umum',
  cooldown: 3,
  data: new SlashCommandBuilder()
    .setName('voice')
    .setDescription('Kelola room voice channel pribadimu (Temp Voice)')
    .addSubcommand((sub) =>
      sub
        .setName('rename')
        .setDescription('Ganti nama voice channel saat ini')
        .addStringOption((opt) => opt.setName('nama').setDescription('Nama baru channel').setRequired(true)),
    )
    .addSubcommand((sub) =>
      sub
        .setName('limit')
        .setDescription('Atur batas maksimal orang di voice channel (0 = tanpa batas)')
        .addIntegerOption((opt) =>
          opt
            .setName('jumlah')
            .setDescription('Maksimal orang (0–99)')
            .setMinValue(0)
            .setMaxValue(99)
            .setRequired(true),
        ),
    )
    .addSubcommand((sub) => sub.setName('lock').setDescription('Kunci voice channel agar orang lain tidak bisa masuk'))
    .addSubcommand((sub) => sub.setName('unlock').setDescription('Buka kembali kunci voice channel')),
  async execute(interaction) {
    const voiceChannel = interaction.member?.voice?.channel;
    if (!voiceChannel) {
      return interaction.reply({
        embeds: [errorEmbed('Tidak di Voice Channel', 'Kamu harus berada di dalam voice channel untuk memakai perintah ini.')],
        flags: MessageFlags.Ephemeral,
      });
    }

    const canManage = voiceChannel.permissionsFor(interaction.member)?.has(PermissionFlagsBits.ManageChannels);
    if (!canManage) {
      return interaction.reply({
        embeds: [errorEmbed('Tidak Ada Izin', 'Kamu hanya bisa mengatur voice channel buatanmu sendiri (dari `➕ Buat Voice`) atau jika kamu Admin.')],
        flags: MessageFlags.Ephemeral,
      });
    }

    const sub = interaction.options.getSubcommand();

    if (sub === 'rename') {
      const name = interaction.options.getString('nama').slice(0, 50);
      await voiceChannel.setName(name);
      return interaction.reply({
        embeds: [successEmbed('Nama Channel Diubah', `Voice channel sekarang bernama **${name}**.`)],
      });
    }

    if (sub === 'limit') {
      const limit = interaction.options.getInteger('jumlah');
      await voiceChannel.setUserLimit(limit);
      return interaction.reply({
        embeds: [
          successEmbed(
            'Batas Anggota Diperbarui',
            limit === 0 ? 'Batas anggota dihapus (**tanpa batas**).' : `Maksimal anggota diatur ke **${limit} orang**.`,
          ),
        ],
      });
    }

    if (sub === 'lock') {
      await voiceChannel.permissionOverwrites.edit(interaction.guild.id, { Connect: false });
      return interaction.reply({
        embeds: [successEmbed('Channel Dikunci 🔒', 'Member lain tidak bisa masuk ke voice channel ini.')],
      });
    }

    if (sub === 'unlock') {
      await voiceChannel.permissionOverwrites.edit(interaction.guild.id, { Connect: null });
      return interaction.reply({
        embeds: [successEmbed('Channel Dibuka 🔓', 'Member lain sekarang bisa bergabung kembali.')],
      });
    }
  },
};
