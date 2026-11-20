require('dotenv').config();
const fs = require('node:fs');
const path = require('node:path');
const { REST, Routes } = require('discord.js');

const token = process.env.DISCORD_TOKEN;
const clientId = process.env.CLIENT_ID;
const guildId = process.env.GUILD_ID;

if (!token || token === 'masukkan_bot_token_anda_di_sini') {
  console.error('❌ [ERROR] DISCORD_TOKEN belum diisi di file .env!');
  process.exit(1);
}

if (!clientId || clientId === 'masukkan_client_id_anda_di_sini') {
  console.error('❌ [ERROR] CLIENT_ID belum diisi di file .env!');
  process.exit(1);
}

const commands = [];
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
      commands.push(command.data.toJSON());
    } else {
      console.warn(`⚠️ [WARNING] Command di ${filePath} tidak memiliki properti "data" atau "execute".`);
    }
  }
}

const rest = new REST().setToken(token);

(async () => {
  try {
    console.log(`🔄 Mulai mendaftarkan ${commands.length} slash command...`);

    if (guildId) {
      const data = await rest.put(
        Routes.applicationGuildCommands(clientId, guildId),
        { body: commands },
      );
      console.log(`✅ Berhasil mendaftarkan ${data.length} slash command ke server (Guild ID: ${guildId}) secara instan!`);
    } else {
      const data = await rest.put(
        Routes.applicationCommands(clientId),
        { body: commands },
      );
      console.log(`✅ Berhasil mendaftarkan ${data.length} slash command secara global! (Bisa butuh hingga 1 jam untuk muncul di semua server)`);
    }
  } catch (error) {
    console.error('❌ Gagal mendaftarkan slash command:', error);
    process.exit(1);
  }
})();
