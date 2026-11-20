# 🤖 Bot Discord Fitur Lengkap (discord.js v14)

Bot Discord modular menggunakan **Node.js** dan **discord.js v14** dengan fitur **Auto Setup**, **AI Chatbot**, **Musik Voice Channel**, **Moderasi**, **Mini-Games**, dan siap **Online 24 Jam**.

---

## 📋 Daftar Fitur & Perintah (26 Commands)

### ⚙️ Admin & Auto Setup
- `/setup auto` — Buat otomatis kategori `🤖 BOT CENTER`, channel `#welcome-goodbye`, `#ai-chat`, `#bot-logs`, dan role `Member` (Auto-Role)
- `/setup channel` — Atur manual channel Welcome, AI Chat, atau Bot Logs
- `/setup autorole` — Atur atau matikan Auto-Role untuk member baru
- `/setup status` — Lihat konfigurasi setup server saat ini

### ✨ AI Chatbot (Google Gemini)
- `/ask <pertanyaan>` — Tanya apa saja ke AI dengan jawaban embed
- `/aichat-reset` — Hapus ingatan/riwayat obrolan AI di channel saat ini
- **Chat Langsung** — Ketik apa saja di channel `#ai-chat` (hasil `/setup auto`) atau **mention `@Bot`** di channel mana saja untuk ngobrol langsung dengan AI!

### 🎵 Musik (Voice Channel)
- `/play <lagu/url>` — Putar lagu dari YouTube (bisa pakai judul lagu atau link)
- `/skip` — Lewati lagu yang sedang diputar
- `/pause` — Jeda lagu sementara
- `/resume` — Lanjutkan lagu yang dijeda
- `/queue` — Lihat daftar antrean lagu
- `/stop` — Hentikan musik & keluarkan bot dari voice channel

### 📁 Umum & Utilitas
- `/ping`, `/help`, `/serverinfo`, `/userinfo`, `/avatar`, `/poll`, `/remind`

### 🛡️ Moderasi
- `/clear`, `/kick`, `/ban`, `/timeout`, `/warn add|list|clear`, `/slowmode`

### 🎮 Fun & Mini-Games
- `/8ball`, `/coinflip`, `/dice`, `/rps` (tombol interaktif)

---

## ⚠️ Pengaturan Penting di Discord Developer Portal

Agar fitur **Welcome/Goodbye** dan **AI Chatbot (`#ai-chat` & mention)** berfungsi, aktifkan kedua intent ini di https://discord.com/developers/applications → pilih aplikasi Anda → menu **Bot** → **Privileged Gateway Intents**:
- ✅ **Server Members Intent**
- ✅ **Message Content Intent**

Lalu klik **Save Changes**.

---

## 🚀 Menjalankan di PC Lokal

1. Pastikan file `.env` sudah terisi (`DISCORD_TOKEN`, `CLIENT_ID`, `GUILD_ID`, dan `GEMINI_API_KEY` dari https://aistudio.google.com/apikey).
2. Daftarkan slash commands terbaru:
   ```powershell
   cd D:\dcbot
   npm.cmd run deploy
   ```
3. Jalankan bot:
   ```powershell
   npm.cmd start
   ```

---

## 🌐 Panduan Hosting Online 24 Jam (Tanpa Menyalakan PC)

Bot ini sudah dilengkapi **HTTP Healthcheck Server** (port `3000`), **`Dockerfile`**, **`render.yaml`**, dan **`ecosystem.config.cjs`** (PM2).

### Opsi 1: Render.com / Koyeb (Gratis)
1. Upload folder `D:\dcbot` ke repository **GitHub** (file `.env` otomatis diabaikan oleh `.gitignore`, jadi token Anda aman).
2. Daftar di https://render.com atau https://koyeb.com → buat **Web Service** baru → hubungkan ke repo GitHub Anda (pilih runtime **Docker**).
3. Di menu **Environment Variables**, masukkan:
   - `DISCORD_TOKEN`
   - `CLIENT_ID`
   - `GUILD_ID` *(opsional)*
   - `GEMINI_API_KEY` *(untuk AI Chatbot)*
4. Klik **Deploy**.
5. *(Khusus Render Free Tier agar tidak sleep)*: Daftar gratis di https://uptimerobot.com → buat monitor HTTP(s) ke URL Render Anda setiap **5 menit**.

### Opsi 2: Railway.app (Paling Praktis, Tidak Sleep)
1. Upload proyek ke GitHub.
2. Buka https://railway.app → **New Project → Deploy from GitHub Repo**.
3. Masukkan Environment Variables (`DISCORD_TOKEN`, `CLIENT_ID`, `GEMINI_API_KEY`).
4. Railway akan otomatis build menggunakan `Dockerfile` dan bot langsung online 24 jam.

### Opsi 3: VPS Linux (Ubuntu/Debian) dengan PM2
```bash
git clone <url-repo-anda>
cd dcbot
npm install --omit=dev
# Buat file .env lalu isi token Anda
npm install -g pm2
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup
```
