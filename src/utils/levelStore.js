const fs = require('node:fs');
const path = require('node:path');

const DATA_DIR = path.join(__dirname, '..', '..', 'data');
const LEVELS_FILE = path.join(DATA_DIR, 'levels.json');
const xpCooldowns = new Map();

function ensureStore() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(LEVELS_FILE)) fs.writeFileSync(LEVELS_FILE, JSON.stringify({}, null, 2), 'utf8');
}

function readAll() {
  ensureStore();
  try {
    return JSON.parse(fs.readFileSync(LEVELS_FILE, 'utf8'));
  } catch {
    return {};
  }
}

function writeAll(data) {
  ensureStore();
  fs.writeFileSync(LEVELS_FILE, JSON.stringify(data, null, 2), 'utf8');
}

function xpForNextLevel(level) {
  return 100 * level;
}

function addMessageXp(guildId, userId) {
  const key = `${guildId}:${userId}`;
  const now = Date.now();
  const last = xpCooldowns.get(key) || 0;
  // Cooldown 45 detik antar perolehan XP agar tidak spam
  if (now - last < 45_000) return { leveledUp: false };
  xpCooldowns.set(key, now);

  const data = readAll();
  if (!data[guildId]) data[guildId] = {};
  if (!data[guildId][userId]) {
    data[guildId][userId] = { xp: 0, level: 1, messages: 0 };
  }

  const user = data[guildId][userId];
  const gained = Math.floor(Math.random() * 16) + 15; // 15–30 XP
  user.xp += gained;
  user.messages += 1;

  let leveledUp = false;
  while (user.xp >= xpForNextLevel(user.level)) {
    user.xp -= xpForNextLevel(user.level);
    user.level += 1;
    leveledUp = true;
  }

  writeAll(data);
  return { leveledUp, level: user.level, xp: user.xp, needed: xpForNextLevel(user.level) };
}

function getUserRank(guildId, userId) {
  const data = readAll();
  const guildData = data[guildId] || {};
  const entries = Object.entries(guildData).sort(([, a], [, b]) => {
    if (b.level !== a.level) return b.level - a.level;
    return b.xp - a.xp;
  });

  const index = entries.findIndex(([id]) => id === userId);
  const stats = guildData[userId] || { xp: 0, level: 1, messages: 0 };
  return {
    ...stats,
    needed: xpForNextLevel(stats.level),
    rank: index === -1 ? entries.length + 1 : index + 1,
    totalUsers: entries.length,
  };
}

function getLeaderboard(guildId, limit = 10) {
  const data = readAll();
  const guildData = data[guildId] || {};
  return Object.entries(guildData)
    .map(([userId, stats]) => ({ userId, ...stats }))
    .sort((a, b) => (b.level !== a.level ? b.level - a.level : b.xp - a.xp))
    .slice(0, limit);
}

module.exports = {
  addMessageXp,
  getUserRank,
  getLeaderboard,
  xpForNextLevel,
};
