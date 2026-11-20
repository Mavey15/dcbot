const {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  demuxProbe,
  AudioPlayerStatus,
  VoiceConnectionStatus,
  entersState,
  NoSubscriberBehavior,
} = require('@discordjs/voice');
const { Ytdl, Quality, SearchType, parseVideoId } = require('@distube/ytdl-core');
const ffmpegStatic = require('ffmpeg-static');
const { createEmbed, COLORS } = require('./embed');

if (ffmpegStatic && !process.env.FFMPEG_PATH) {
  process.env.FFMPEG_PATH = ffmpegStatic;
}

const yt = new Ytdl();
const queues = new Map();
// Menyimpan preferensi autoplay per server (default: aktif)
const autoplayPrefs = new Map();

function isAutoplayEnabled(guildId) {
  if (!autoplayPrefs.has(guildId)) return true;
  return autoplayPrefs.get(guildId);
}

function setAutoplay(guildId, enabled) {
  const nextVal = typeof enabled === 'boolean' ? enabled : !isAutoplayEnabled(guildId);
  autoplayPrefs.set(guildId, nextVal);
  const state = queues.get(guildId);
  if (state) {
    state.autoplay = nextVal;
  }
  return nextVal;
}

function formatDuration(seconds) {
  const sec = parseInt(seconds, 10) || 0;
  if (sec <= 0) return 'Live';
  const hrs = Math.floor(sec / 3600);
  const mins = Math.floor((sec % 3600) / 60);
  const rem = String(sec % 60).padStart(2, '0');
  return hrs > 0 ? `${hrs}:${String(mins).padStart(2, '0')}:${rem}` : `${mins}:${rem}`;
}

function isYouTubeUrl(input) {
  if (!/^https?:\/\//i.test(input.trim())) return false;
  try {
    return Boolean(parseVideoId(input.trim()));
  } catch {
    return false;
  }
}

async function searchTrack(query, requestedBy) {
  if (isYouTubeUrl(query)) {
    const info = await yt.getInfo(query.trim());
    const details = info.videoDetails;

    return {
      id: details.videoId,
      title: details.title,
      url: details.video_url || `https://www.youtube.com/watch?v=${details.videoId}`,
      duration: formatDuration(details.lengthSeconds),
      thumbnail: details.thumbnails?.[0]?.url || null,
      author: details.author?.name || 'YouTube',
      requestedBy,
    };
  }

  // Pencarian otomatis berdasarkan judul lagu (tanpa perlu link)
  const results = await yt.search(query, { type: SearchType.VIDEO });
  const video = Array.isArray(results) ? results[0] : null;
  if (!video) return null;

  return {
    id: video.id,
    title: video.title,
    url: video.url || `https://www.youtube.com/watch?v=${video.id}`,
    duration: video.isLive ? 'Live' : formatDuration(video.lengthSeconds),
    thumbnail: video.thumbnails?.[0]?.url || null,
    author: video.author?.name || 'YouTube',
    requestedBy,
  };
}

async function findRelatedTrack(lastSong, playedIds) {
  try {
    const related = await yt.getRelated(lastSong.url);
    if (!Array.isArray(related) || related.length === 0) return null;

    // Pilih lagu terkait yang belum pernah diputar & bukan live/terlalu panjang
    const candidate =
      related.find(
        (v) =>
          v.id &&
          !playedIds.has(v.id) &&
          !v.isLive &&
          (!v.lengthSeconds || v.lengthSeconds <= 900),
      ) || related.find((v) => v.id && !playedIds.has(v.id)) || related[0];

    if (!candidate) return null;

    return {
      id: candidate.id,
      title: candidate.title,
      url: candidate.url || `https://www.youtube.com/watch?v=${candidate.id}`,
      duration: candidate.isLive ? 'Live' : formatDuration(candidate.lengthSeconds),
      thumbnail: candidate.thumbnails?.[0]?.url || null,
      author: candidate.author?.name || 'YouTube',
      requestedBy: '🔄 Autoplay',
    };
  } catch (err) {
    console.error('Autoplay getRelated error:', err.message);
    return null;
  }
}

function getGuildQueue(guildId) {
  return queues.get(guildId);
}

function cleanupGuild(guildId) {
  const state = queues.get(guildId);
  if (!state) return;

  if (state.idleTimer) {
    clearTimeout(state.idleTimer);
    state.idleTimer = null;
  }

  try {
    state.player.stop(true);
  } catch {}

  try {
    state.connection.destroy();
  } catch {}

  queues.delete(guildId);
}

async function playNext(guildId) {
  const state = queues.get(guildId);
  if (!state) return;

  if (state.idleTimer) {
    clearTimeout(state.idleTimer);
    state.idleTimer = null;
  }

  let nextSong = state.songs.shift();

  // Jika antrean kosong dan Autoplay aktif, cari lagu terkait otomatis
  if (!nextSong && state.autoplay && state.lastSong) {
    nextSong = await findRelatedTrack(state.lastSong, state.playedIds);
  }

  if (!nextSong) {
    state.current = null;
    // Keluar otomatis jika tidak ada lagu selama 2 menit
    state.idleTimer = setTimeout(() => {
      cleanupGuild(guildId);
    }, 120_000);
    return;
  }

  state.current = nextSong;
  state.lastSong = nextSong;
  if (nextSong.id) {
    state.playedIds.add(nextSong.id);
    if (state.playedIds.size > 50) {
      const oldest = state.playedIds.values().next().value;
      state.playedIds.delete(oldest);
    }
  }

  try {
    // Pastikan koneksi voice sudah Ready sebelum mulai kirim audio
    if (state.connection.state.status !== VoiceConnectionStatus.Ready) {
      await entersState(state.connection, VoiceConnectionStatus.Ready, 15_000);
    }

    const rawStream = await yt.download(nextSong.url, {
      filter: { hasAudio: true, hasVideo: false },
      quality: Quality.HIGHEST_AUDIO,
    });

    rawStream.on('error', (err) => {
      console.error('Stream error:', err.message);
    });

    const { stream, type } = await demuxProbe(rawStream);
    const resource = createAudioResource(stream, { inputType: type });
    state.player.play(resource);

    if (state.textChannel) {
      const isAuto = nextSong.requestedBy === '🔄 Autoplay';
      const embed = createEmbed({
        title: isAuto ? '🔄 Autoplay Memutar' : '🎵 Sedang Memutar',
        description: `**[${nextSong.title}](${nextSong.url})**`,
        color: isAuto ? COLORS.INFO : COLORS.PRIMARY,
        thumbnail: nextSong.thumbnail,
        fields: [
          { name: '⏱️ Durasi', value: nextSong.duration, inline: true },
          { name: '📺 Channel', value: nextSong.author, inline: true },
          { name: '👤 Diminta oleh', value: `${nextSong.requestedBy}`, inline: true },
        ],
        footer: { text: `Autoplay: ${state.autoplay ? 'Aktif (ON)' : 'Nonaktif (OFF)'} • Gunakan /autoplay untuk mengubah` },
      });
      state.textChannel.send({ embeds: [embed] }).catch(() => {});
    }
  } catch (error) {
    console.error('Gagal memutar lagu:', error);
    if (state.textChannel) {
      state.textChannel
        .send(`❌ Gagal memutar **${nextSong.title}**, lanjut ke lagu berikutnya...`)
        .catch(() => {});
    }
    playNext(guildId);
  }
}

async function enqueue(interaction, voiceChannel, query) {
  const track = await searchTrack(query, interaction.user);
  if (!track) {
    throw new Error('NOT_FOUND');
  }

  const guildId = interaction.guild.id;
  let state = queues.get(guildId);

  if (!state) {
    const connection = joinVoiceChannel({
      channelId: voiceChannel.id,
      guildId,
      adapterCreator: interaction.guild.voiceAdapterCreator,
      selfDeaf: true,
    });

    const player = createAudioPlayer({
      behaviors: {
        noSubscriber: NoSubscriberBehavior.Pause,
      },
    });

    connection.subscribe(player);

    state = {
      connection,
      player,
      songs: [],
      current: null,
      lastSong: null,
      playedIds: new Set(),
      autoplay: isAutoplayEnabled(guildId),
      textChannel: interaction.channel,
      voiceChannelId: voiceChannel.id,
      idleTimer: null,
    };

    player.on(AudioPlayerStatus.Idle, () => {
      playNext(guildId);
    });

    player.on('error', (err) => {
      console.error('AudioPlayer error:', err.message);
      playNext(guildId);
    });

    connection.on(VoiceConnectionStatus.Disconnected, async () => {
      try {
        await Promise.race([
          entersState(connection, VoiceConnectionStatus.Signalling, 5_000),
          entersState(connection, VoiceConnectionStatus.Connecting, 5_000),
        ]);
      } catch {
        cleanupGuild(guildId);
      }
    });

    queues.set(guildId, state);
  }

  state.textChannel = interaction.channel;
  state.songs.push(track);

  const startedImmediately = !state.current && state.player.state.status === AudioPlayerStatus.Idle;
  if (startedImmediately) {
    await playNext(guildId);
  }

  return { track, position: startedImmediately ? 0 : state.songs.length };
}

function skip(guildId) {
  const state = queues.get(guildId);
  if (!state || !state.current) return false;
  state.player.stop();
  return true;
}

function pause(guildId) {
  const state = queues.get(guildId);
  if (!state || !state.current) return false;
  return state.player.pause();
}

function resume(guildId) {
  const state = queues.get(guildId);
  if (!state || !state.current) return false;
  return state.player.unpause();
}

function stop(guildId) {
  const state = queues.get(guildId);
  if (!state) return false;
  cleanupGuild(guildId);
  return true;
}

module.exports = {
  enqueue,
  skip,
  pause,
  resume,
  stop,
  getGuildQueue,
  setAutoplay,
  isAutoplayEnabled,
};
