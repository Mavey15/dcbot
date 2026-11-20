const { Events, ChannelType, PermissionFlagsBits } = require('discord.js');
const { getGuildConfig } = require('../utils/guildConfig');

// Menyimpan ID channel voice sementara yang dibuat oleh bot
const tempVoiceChannels = new Set();

module.exports = {
  name: Events.VoiceStateUpdate,
  async execute(oldState, newState) {
    const guild = newState.guild || oldState.guild;
    if (!guild) return;

    const config = getGuildConfig(guild.id);

    // 1. Jika user masuk ke channel "➕ Buat Voice" (Join-to-Create)
    if (
      config.joinToCreateChannelId &&
      newState.channelId === config.joinToCreateChannelId &&
      oldState.channelId !== config.joinToCreateChannelId &&
      newState.member &&
      !newState.member.user.bot
    ) {
      const triggerChannel = newState.channel;
      const member = newState.member;
      const roomName = `🔊 Room ${member.displayName.slice(0, 20)}`;

      try {
        const tempChannel = await guild.channels.create({
          name: roomName,
          type: ChannelType.GuildVoice,
          parent: triggerChannel?.parentId || null,
          bitrate: 64000,
          permissionOverwrites: [
            {
              id: member.id,
              allow: [
                PermissionFlagsBits.ManageChannels,
                PermissionFlagsBits.MoveMembers,
                PermissionFlagsBits.Connect,
                PermissionFlagsBits.Speak,
              ],
            },
            {
              id: guild.client.user.id,
              allow: [
                PermissionFlagsBits.ManageChannels,
                PermissionFlagsBits.MoveMembers,
                PermissionFlagsBits.Connect,
              ],
            },
          ],
        });

        tempVoiceChannels.add(tempChannel.id);
        await member.voice.setChannel(tempChannel).catch(() => {});
      } catch (error) {
        console.error('Gagal membuat Temp Voice channel:', error.message);
      }
    }

    // 2. Hapus otomatis Temp Voice channel jika sudah kosong
    if (oldState.channelId && tempVoiceChannels.has(oldState.channelId)) {
      const oldChannel = oldState.channel;
      if (oldChannel && oldChannel.members.size === 0) {
        tempVoiceChannels.delete(oldChannel.id);
        await oldChannel.delete('Temp Voice room kosong').catch(() => {});
      }
    }
  },
};
