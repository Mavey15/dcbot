const {
  Events,
  Collection,
  MessageFlags,
  ChannelType,
  PermissionFlagsBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require('discord.js');
const { createEmbed, successEmbed, errorEmbed, warnEmbed, COLORS } = require('../utils/embed');
const { getGuildConfig } = require('../utils/guildConfig');

async function handleButton(interaction) {
  const { customId, guild, member, user } = interaction;

  // 1. Self-Role Toggle Button
  if (customId.startsWith('selfrole_')) {
    const roleId = customId.replace('selfrole_', '');
    const role = guild.roles.cache.get(roleId);

    if (!role) {
      return interaction.reply({
        embeds: [errorEmbed('Role Tidak Ditemukan', 'Role ini sudah dihapus dari server.')],
        flags: MessageFlags.Ephemeral,
      });
    }

    try {
      if (member.roles.cache.has(roleId)) {
        await member.roles.remove(role);
        return interaction.reply({
          embeds: [successEmbed('Role Dilepas', `Role ${role} telah dilepas dari profilmu.`)],
          flags: MessageFlags.Ephemeral,
        });
      } else {
        await member.roles.add(role);
        return interaction.reply({
          embeds: [successEmbed('Role Ditambahkan', `Kamu sekarang memiliki role ${role}!`)],
          flags: MessageFlags.Ephemeral,
        });
      }
    } catch {
      return interaction.reply({
        embeds: [errorEmbed('Gagal Mengubah Role', 'Pastikan posisi role bot lebih tinggi dari role tersebut.')],
        flags: MessageFlags.Ephemeral,
      });
    }
  }

  // 2. Ticket Create Button
  if (customId === 'ticket_create') {
    const safeName = `ticket-${user.username.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 15) || user.id.slice(-4)}`;
    const existing = guild.channels.cache.find((c) => c.name === safeName);

    if (existing) {
      return interaction.reply({
        embeds: [warnEmbed('Tiket Sudah Ada', `Kamu sudah memiliki tiket terbuka di ${existing}.`)],
        flags: MessageFlags.Ephemeral,
      });
    }

    try {
      const channel = await guild.channels.create({
        name: safeName,
        type: ChannelType.GuildText,
        permissionOverwrites: [
          {
            id: guild.id,
            deny: [PermissionFlagsBits.ViewChannel],
          },
          {
            id: user.id,
            allow: [
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.SendMessages,
              PermissionFlagsBits.ReadMessageHistory,
            ],
          },
          {
            id: interaction.client.user.id,
            allow: [
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.SendMessages,
              PermissionFlagsBits.ManageChannels,
            ],
          },
        ],
      });

      const closeRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('ticket_close')
          .setLabel('Tutup Tiket')
          .setEmoji('🔒')
          .setStyle(ButtonStyle.Danger),
      );

      const welcomeEmbed = createEmbed({
        title: `🎫 Tiket Milik ${user.username}`,
        description: `Halo ${user}! Silakan jelaskan kendala atau pertanyaanmu di sini.\nStaff akan segera membantu. Klik tombol **Tutup Tiket** jika sudah selesai.`,
        color: COLORS.PRIMARY,
      });

      await channel.send({ content: `${user}`, embeds: [welcomeEmbed], components: [closeRow] });
      return interaction.reply({
        embeds: [successEmbed('Tiket Dibuat', `Channel tiketmu telah dibuat di ${channel}!`)],
        flags: MessageFlags.Ephemeral,
      });
    } catch (err) {
      console.error('Ticket create error:', err);
      return interaction.reply({
        embeds: [errorEmbed('Gagal Membuat Tiket', 'Pastikan bot memiliki izin `Manage Channels`.')],
        flags: MessageFlags.Ephemeral,
      });
    }
  }

  // 3. Ticket Close Button
  if (customId === 'ticket_close') {
    await interaction.reply({
      embeds: [warnEmbed('Menutup Tiket', 'Channel tiket ini akan dihapus dalam 3 detik...')],
    });
    setTimeout(() => {
      interaction.channel?.delete('Tiket ditutup oleh user/staff').catch(() => {});
    }, 3000);
  }
}

module.exports = {
  name: Events.InteractionCreate,
  async execute(interaction) {
    if (interaction.isButton()) {
      await handleButton(interaction);
      return;
    }

    if (!interaction.isChatInputCommand()) return;

    const command = interaction.client.commands.get(interaction.commandName);
    if (!command) {
      console.error(`Command tidak ditemukan: ${interaction.commandName}`);
      return;
    }

    // Jika server memakai mode "Khusus Musik", batasi hanya perintah Musik + /setup + /help + /ping
    if (interaction.guild) {
      const cfg = getGuildConfig(interaction.guild.id);
      const allowedInMusicMode = ['setup', 'help', 'ping'];
      if (cfg.mode === 'music' && command.category !== 'Musik' && !allowedInMusicMode.includes(command.data.name)) {
        return interaction.reply({
          embeds: [
            warnEmbed(
              'Mode Khusus Musik Aktif 🎵',
              'Server ini disetel ke mode **Khusus Musik**. Hanya perintah musik (`/play`, `/skip`, `/queue`, `/shuffle`, `/autoplay`, `/stop`, dll.) yang aktif.\n*(Admin dapat mengubahnya lewat `/setup mode`.)*',
            ),
          ],
          flags: MessageFlags.Ephemeral,
        });
      }
    }

    // Cooldown handler
    const { cooldowns } = interaction.client;
    if (!cooldowns.has(command.data.name)) {
      cooldowns.set(command.data.name, new Collection());
    }

    const now = Date.now();
    const timestamps = cooldowns.get(command.data.name);
    const defaultCooldownSeconds = 3;
    const cooldownAmount = (command.cooldown ?? defaultCooldownSeconds) * 1000;

    if (timestamps.has(interaction.user.id)) {
      const expirationTime = timestamps.get(interaction.user.id) + cooldownAmount;
      if (now < expirationTime) {
        const expiredTimestamp = Math.round(expirationTime / 1000);
        return interaction.reply({
          embeds: [
            warnEmbed(
              'Cooldown Aktif',
              `Tunggu sebentar sebelum memakai \`/${command.data.name}\` lagi. Coba lagi <t:${expiredTimestamp}:R>.`,
            ),
          ],
          flags: MessageFlags.Ephemeral,
        });
      }
    }

    timestamps.set(interaction.user.id, now);
    setTimeout(() => timestamps.delete(interaction.user.id), cooldownAmount);

    try {
      await command.execute(interaction);
    } catch (error) {
      console.error(`Error saat menjalankan /${interaction.commandName}:`, error);
      const embed = errorEmbed(
        'Terjadi Kesalahan',
        'Maaf, terjadi error saat menjalankan command ini. Silakan coba lagi nanti.',
      );

      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ embeds: [embed], flags: MessageFlags.Ephemeral }).catch(() => {});
      } else {
        await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral }).catch(() => {});
      }
    }
  },
};
