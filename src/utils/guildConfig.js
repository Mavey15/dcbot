const fs = require('node:fs');
const path = require('node:path');

const DATA_DIR = path.join(__dirname, '..', '..', 'data');
const CONFIG_FILE = path.join(DATA_DIR, 'guildConfig.json');

function ensureStore() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(CONFIG_FILE)) {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify({}, null, 2), 'utf8');
  }
}

function readAll() {
  ensureStore();
  try {
    return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
  } catch {
    return {};
  }
}

function writeAll(data) {
  ensureStore();
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(data, null, 2), 'utf8');
}

function getGuildConfig(guildId) {
  const data = readAll();
  return data[guildId] || {};
}

function updateGuildConfig(guildId, patch) {
  const data = readAll();
  data[guildId] = {
    ...(data[guildId] || {}),
    ...patch,
  };
  writeAll(data);
  return data[guildId];
}

module.exports = {
  getGuildConfig,
  updateGuildConfig,
};
