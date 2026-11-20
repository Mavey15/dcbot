const { EmbedBuilder } = require('discord.js');

const COLORS = {
  PRIMARY: 0x5865f2, // Discord Blurple
  SUCCESS: 0x57f287,
  WARNING: 0xfee75c,
  ERROR: 0xed4245,
  INFO: 0x3498db,
};

function createEmbed({ title, description, color = COLORS.PRIMARY, fields = [], footer, thumbnail, image }) {
  const embed = new EmbedBuilder().setColor(color).setTimestamp();

  if (title) embed.setTitle(title);
  if (description) embed.setDescription(description);
  if (fields.length > 0) embed.addFields(fields);
  if (footer) embed.setFooter(typeof footer === 'string' ? { text: footer } : footer);
  if (thumbnail) embed.setThumbnail(thumbnail);
  if (image) embed.setImage(image);

  return embed;
}

function successEmbed(title, description) {
  return createEmbed({ title: `✅ ${title}`, description, color: COLORS.SUCCESS });
}

function errorEmbed(title, description) {
  return createEmbed({ title: `❌ ${title}`, description, color: COLORS.ERROR });
}

function warnEmbed(title, description) {
  return createEmbed({ title: `⚠️ ${title}`, description, color: COLORS.WARNING });
}

function infoEmbed(title, description) {
  return createEmbed({ title: `ℹ️ ${title}`, description, color: COLORS.INFO });
}

module.exports = {
  COLORS,
  createEmbed,
  successEmbed,
  errorEmbed,
  warnEmbed,
  infoEmbed,
};
