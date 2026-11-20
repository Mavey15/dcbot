const fs = require('node:fs');
const path = require('node:path');

const DATA_DIR = path.join(__dirname, '..', '..', 'data');
const WARNINGS_FILE = path.join(DATA_DIR, 'warnings.json');

function ensureStore() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(WARNINGS_FILE)) {
    fs.writeFileSync(WARNINGS_FILE, JSON.stringify({}, null, 2), 'utf8');
  }
}

function readAll() {
  ensureStore();
  try {
    return JSON.parse(fs.readFileSync(WARNINGS_FILE, 'utf8'));
  } catch {
    return {};
  }
}

function writeAll(data) {
  ensureStore();
  fs.writeFileSync(WARNINGS_FILE, JSON.stringify(data, null, 2), 'utf8');
}

function addWarning(guildId, userId, moderatorId, reason) {
  const data = readAll();
  if (!data[guildId]) data[guildId] = {};
  if (!data[guildId][userId]) data[guildId][userId] = [];

  const entry = {
    id: data[guildId][userId].length + 1,
    moderatorId,
    reason,
    timestamp: new Date().toISOString(),
  };

  data[guildId][userId].push(entry);
  writeAll(data);
  return { entry, total: data[guildId][userId].length };
}

function getWarnings(guildId, userId) {
  const data = readAll();
  return data[guildId]?.[userId] ?? [];
}

function clearWarnings(guildId, userId) {
  const data = readAll();
  if (data[guildId]?.[userId]) {
    delete data[guildId][userId];
    writeAll(data);
    return true;
  }
  return false;
}

module.exports = {
  addWarning,
  getWarnings,
  clearWarnings,
};
