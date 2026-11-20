const afkMap = new Map();

function setAfk(guildId, userId, reason) {
  afkMap.set(`${guildId}:${userId}`, {
    reason: reason || 'Sedang AFK',
    since: Date.now(),
  });
}

function getAfk(guildId, userId) {
  return afkMap.get(`${guildId}:${userId}`) || null;
}

function clearAfk(guildId, userId) {
  const key = `${guildId}:${userId}`;
  const existed = afkMap.get(key) || null;
  afkMap.delete(key);
  return existed;
}

module.exports = {
  setAfk,
  getAfk,
  clearAfk,
};
