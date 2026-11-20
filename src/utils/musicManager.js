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
const scdl = require('soundcloud-downloader').default;
const { Ytdl, Quality, SearchType, parseVideoId } = require('@distube/ytdl-core');
const fs = require('node:fs');
const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');
const { createEmbed, COLORS } = require('./embed');

if (ffmpegInstaller?.path) {
  if (!process.env.FFMPEG_PATH) {
    process.env.FFMPEG_PATH = ffmpegInstaller.path;
  }
  // Pastikan binary ffmpeg punya izin execute di Linux (jika postinstall chmod diblokir hosting)
  if (process.platform !== 'win32') {
    try {
      fs.chmodSync(ffmpegInstaller.path, 0o755);
    } catch {}
  }
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

function isSoundCloudUrl(input) {
  return /^https?:\/\/(www\.|m\.)?soundcloud\.com\//i.test(input.trim());
}

async function searchSoundCloud(query, requestedBy, excludeIds = new Set()) {
  const res = await scdl.search({ query, resourceType: 'tracks', limit: 8 });
  const list = res?.collection || [];
  const track =
    list.find((t) => t?.permalink_url && t.streamable !== false && !excludeIds.has(`sc:${t.id}`)) ||
    list.find((t) => t?.permalink_url && !excludeIds.has(`sc:${t.id}`)) ||
    list[0];

  if (!track || !track.permalink_url) return null;

  return {
    id: `sc:${track.id}`,
    source: 'soundcloud',
    title: track.title,
    url: track.permalink_url,
    duration: formatDuration(Math.floor((track.duration || 0) / 1000)),
    thumbnail: track.artwork_url ? track.artwork_url.replace('-large', '-t500x500') : null,
    author: track.user?.username || 'SoundCloud',
    requestedBy,
  };
}

async function searchTrack(query, requestedBy) {
  const trimmed = query.trim();

  // 1. Jika link SoundCloud
  if (isSoundCloudUrl(trimmed)) {
    const info = await scdl.getInfo(trimmed);
    return {
      id: `sc:${info.id}`,
      source: 'soundcloud',
      title: info.title,
      url: info.permalink_url || trimmed,
      duration: formatDuration(Math.floor((info.duration || 0) / 1000)),
      thumbnail: info.artwork_url ? info.artwork_url.replace('-large', '-t500x500') : null,
      author: info.user?.username || 'SoundCloud',
      requestedBy,
    };
  }

  // 2. Jika link YouTube
  if (isYouTubeUrl(trimmed)) {
    const info = await yt.getInfo(trimmed);
    const details = info.videoDetails;
    return {
      id: `yt:${details.videoId}`,
      source: 'youtube',
      title: details.title,
      url: details.video_url || `https://www.youtube.com/watch?v=${details.videoId}`,
      duration: formatDuration(details.lengthSeconds),
      thumbnail: details.thumbnails?.[0]?.url || null,
      author: details.author?.name || 'YouTube',
      requestedBy,
    };
  }

  // 3. Pencarian berdasarkan judul lagu: pakai SoundCloud dulu (sangat ringan CPU & RAM!)
  try {
    const scTrack = await searchSoundCloud(trimmed, requestedBy);
    if (scTrack) return scTrack;
  } catch (err) {
    console.warn('SoundCloud search gagal, fallback ke YouTube:', err.message);
  }

  // 4. Fallback pencarian ke YouTube jika tidak ketemu di SoundCloud
  const results = await yt.search(trimmed, { type: SearchType.VIDEO });
  const video = Array.isArray(results) ? results[0] : null;
  if (!video) return null;

  return {
    id: `yt:${video.id}`,
    source: 'youtube',
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
    // Cari lagu mirip di SoundCloud (super ringan untuk CPU hosting)
    const cleanTitle = lastSong.title
      .replace(/\(.*?\)|\[.*?\]|official|music|video|lyric|lirik|audio/gi, '')
      .trim();
    const searchKey = lastSong.author && lastSong.author !== 'SoundCloud' && lastSong.author !== 'YouTube'
      ? `${lastSong.author} ${cleanTitle.split(' ').slice(0, 2).join(' ')}`
      : cleanTitle;

    const scRelated = await searchSoundCloud(searchKey || lastSong.title, '🔄 Autoplay', playedIds);
    if (scRelated && !playedIds.has(scRelated.id)) {
      return scRelated;
    }
  } catch (err) {
    console.warn('Autoplay SoundCloud gagal:', err.message);
  }

  return null;
}

async function getAudioStream(song) {
  if (song.source === 'soundcloud') {
    return scdl.download(song.url);
  }

  // Jika sumber YouTube, coba download — jika CPU hosting timeout, fallback otomatis ke SoundCloud!
  try {
    return await yt.download(song.url, {
      filter: { hasAudio: true, hasVideo: false },
      quality: Quality.HIGHEST_AUDIO,
    });
  } catch (err) {
    console.warn(`YouTube download gagal (${err.message}), fallback ke SoundCloud untuk: ${song.title}`);
    const fallback = await searchSoundCloud(song.title, song.requestedBy);
    if (!fallback) throw err;
    return scdl.download(fallback.url);
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
    if (state.connection.state.status !== VoiceConnectionStatus.Ready) {
      await entersState(state.connection, VoiceConnectionStatus.Ready, 15_000);
    }

    const rawStream = await getAudioStream(nextSong);
    rawStream.on('error', (err) => {
      if (err?.code === 'EPIPE' || err?.code === 'ERR_STREAM_PREMATURE_CLOSE') return;
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
          { name: '📺 Artis / Channel', value: nextSong.author, inline: true },
          { name: '👤 Diminta oleh', value: `${nextSong.requestedBy}`, inline: true },
        ],
        footer: {
          text: `Autoplay: ${state.autoplay ? 'Aktif (ON)' : 'Nonaktif (OFF)'} • Gunakan /autoplay untuk mengubah`,
        },
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
