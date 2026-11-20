require('dotenv').config();
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { Client, Collection, GatewayIntentBits } = require('discord.js');

if (!process.env.DISCORD_TOKEN || process.env.DISCORD_TOKEN === 'masukkan_bot_token_anda_di_sini') {
  console.error('❌ [ERROR] DISCORD_TOKEN belum diisi di file .env!');
  console.error('👉 Baca panduan di README.md untuk cara mendapatkan Bot Token.');
  process.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates,
  ],
});

client.commands = new Collection();
client.cooldowns = new Collection();

// Load semua slash commands dari src/commands/<kategori>/*.js
const commandsPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(commandsPath);

for (const folder of commandFolders) {
  const folderPath = path.join(commandsPath, folder);
  if (!fs.statSync(folderPath).isDirectory()) continue;

  const commandFiles = fs.readdirSync(folderPath).filter((file) => file.endsWith('.js'));
  for (const file of commandFiles) {
    const filePath = path.join(folderPath, file);
    const command = require(filePath);
    if ('data' in command && 'execute' in command) {
      command.category = command.category || folder;
      client.commands.set(command.data.name, command);
    } else {
      console.warn(`⚠️ [WARNING] Command di ${filePath} tidak memiliki properti "data" atau "execute".`);
    }
  }
}

// Load semua event handlers dari src/events/*.js
const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter((file) => file.endsWith('.js'));

for (const file of eventFiles) {
  const filePath = path.join(eventsPath, file);
  const event = require(filePath);
  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args));
  } else {
    client.on(event.name, (...args) => event.execute(...args));
  }
}

// HTTP Healthcheck Server untuk hosting 24 jam (Render / Koyeb / Railway / Fly.io)
const PORT = process.env.PORT || 3000;
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(
    JSON.stringify({
      status: 'online',
      bot: client.user ? client.user.tag : 'starting',
      uptimeSeconds: Math.floor(process.uptime()),
      guilds: client.guilds.cache.size,
    }),
  );
});

server.listen(PORT, () => {
  console.log(`🌐 Healthcheck server berjalan di port ${PORT}`);
});

// Tangani error global agar bot tidak mudah crash
process.on('unhandledRejection', (error) => {
  console.error('Unhandled promise rejection:', error);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
});

client.login(process.env.DISCORD_TOKEN);
