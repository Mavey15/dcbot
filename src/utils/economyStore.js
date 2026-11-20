const fs = require('node:fs');
const path = require('node:path');

const DATA_DIR = path.join(__dirname, '..', '..', 'data');
const ECON_FILE = path.join(DATA_DIR, 'economy.json');

function ensureStore() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(ECON_FILE)) fs.writeFileSync(ECON_FILE, JSON.stringify({}, null, 2), 'utf8');
}

function readAll() {
  ensureStore();
  try {
    return JSON.parse(fs.readFileSync(ECON_FILE, 'utf8'));
  } catch {
    return {};
  }
}

function writeAll(data) {
  ensureStore();
  fs.writeFileSync(ECON_FILE, JSON.stringify(data, null, 2), 'utf8');
}

function getAccount(guildId, userId) {
  const data = readAll();
  return (
    data[guildId]?.[userId] || {
      balance: 0,
      lastDaily: 0,
      dailyStreak: 0,
      lastWork: 0,
    }
  );
}

function updateAccount(guildId, userId, updater) {
  const data = readAll();
  if (!data[guildId]) data[guildId] = {};
  const current = data[guildId][userId] || {
    balance: 0,
    lastDaily: 0,
    dailyStreak: 0,
    lastWork: 0,
  };
  const updated = updater(current);
  data[guildId][userId] = updated;
  writeAll(data);
  return updated;
}

function getRichest(guildId, limit = 10) {
  const data = readAll();
  const guildData = data[guildId] || {};
  return Object.entries(guildData)
    .map(([userId, acc]) => ({ userId, balance: acc.balance || 0 }))
    .sort((a, b) => b.balance - a.balance)
    .slice(0, limit);
}

module.exports = {
  getAccount,
  updateAccount,
  getRichest,
};
