const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChannelType,
  MessageFlags,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require('discord.js');
const { createEmbed, successEmbed, errorEmbed, COLORS } = require('../../utils/embed');
const { getGuildConfig, updateGuildConfig } = require('../../utils/guildConfig');

const THEMES = {
  community: {
    label: 'Komunitas Umum',
    interestRoles: [
      { name: '🎮 Gamer', color: 0x9b59b6 },
      { name: '🎵 Music Lover', color: 0x1abc9c },
      { name: '🎬 Film & Anime', color: 0xe67e22 },
      { name: '💻 Tech & Coding', color: 0x3498db },
    ],
    extraChannels: [
      { name: '🖼️・media-meme', topic: 'Bagikan foto, karya, atau meme lucu di sini!' },
    ],
  },
  gaming: {
    label: 'Gaming Server',
    interestRoles: [
      { name: '🔫 FPS / Valorant', color: 0xe74c3c },
      { name: '⚔️ MOBA / MLBB', color: 0x3498db },
      { name: '🧱 Minecraft / Sandbox', color: 0x2ecc71 },
      { name: '🎙️ Cari Party', color: 0xf1c40f },
    ],
    extraChannels: [
      { name: '🎮・cari-mabar', topic: 'Ajak teman mabar dan buat party di sini!' },
      { name: '🏆・clip-highlight', topic: 'Pamerkan highlight dan kemenangan terbaikmu!' },
    ],
  },
  study: {
    label: 'Belajar & Produktivitas',
    interestRoles: [
      { name: '💻 Programming', color: 0x3498db },
      { name: '🎨 Desain & UI/UX', color: 0xe91e63 },
      { name: '📚 Belajar Bareng', color: 0x2ecc71 },
      { name: '💼 Karier & Bisnis', color: 0xf39c12 },
    ],
    extraChannels: [
      { name: '📚・diskusi-materi', topic: 'Diskusi pelajaran, tugas, dan berbagi ilmu.' },
      { name: '🔗・resource-gratis', topic: 'Kumpulan link tools, ebook, dan referensi bermanfaat.' },
    ],
  },
};

module.exports = {
  category: 'Admin & Setup',
  cooldown: 10,
  data: new SlashCommandBuilder()
    .setName('setup')
    .setDescription('Auto-setup server lengkap (kategori, channel, role, izin, rules, tiket, AI, & logs)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand((sub) =>
      sub
        .setName('auto')
        .setDescription('Bangun struktur server profesional secara otomatis dalam 1 klik!')
        .addStringOption((opt) =>
          opt
            .setName('tema')
            .setDescription('Pilih tema server (default: Komunitas Umum)')
            .addChoices(
              { name: '🌐 Komunitas Umum', value: 'community' },
              { name: '🎮 Gaming Server', value: 'gaming' },
              { name: '📚 Belajar & Produktivitas', value: 'study' },
            ),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName('channel')
        .setDescription('Atur channel secara manual untuk fitur tertentu')
        .addStringOption((opt) =>
          opt
            .setName('fitur')
            .setDescription('Fitur yang ingin diatur')
            .setRequired(true)
            .addChoices(
              { name: 'Welcome & Goodbye', value: 'welcome' },
              { name: 'AI Chatbot', value: 'ai' },
              { name: 'Bot Logs', value: 'logs' },
              { name: 'Join-to-Create (Temp Voice)', value: 'jtc' },
            ),
        )
        .addChannelOption((opt) =>
          opt
            .setName('target')
            .setDescription('Pilih text channel (atau voice channel untuk Join-to-Create)')
            .addChannelTypes(ChannelType.GuildText, ChannelType.GuildVoice)
            .setRequired(true),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName('autorole')
        .setDescription('Atur role otomatis untuk member baru (kosongkan untuk mematikan)')
        .addRoleOption((opt) => opt.setName('role').setDescription('Role yang otomatis diberikan')),
    )
    .addSubcommand((sub) =>
      sub
        .setName('mode')
        .setDescription('Pilih mode bot khusus untuk server ini (Fitur Lengkap atau Khusus Musik)')
        .addStringOption((opt) =>
          opt
            .setName('pilihan')
            .setDescription('Mode yang ingin diaktifkan di server ini')
            .setRequired(true)
            .addChoices(
              { name: '🌟 Fitur Lengkap (All-in-One)', value: 'all' },
              { name: '🎵 Khusus Musik (Music Only)', value: 'music' },
            ),
        ),
    )
    .addSubcommand((sub) =>
      sub.setName('status').setDescription('Lihat konfigurasi setup server saat ini'),
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const { guild } = interaction;

    if (sub === 'auto') {
      const themeKey = interaction.options.getString('tema') || 'community';
      const theme = THEMES[themeKey];

      await interaction.deferReply();

      try {
        // Helper buat/cari role tanpa duplikat
        const findOrCreateRole = async ({ name, color, hoist = false, permissions = [] }) => {
          const existing = guild.roles.cache.find((r) => r.name.toLowerCase() === name.toLowerCase());
          if (existing) return existing;
          return guild.roles.create({
            name,
            color,
            hoist,
            permissions,
            reason: `Auto-setup server (${theme.label})`,
          });
        };

        // 1. Buat Role Struktur Server
        const ownerRole = await findOrCreateRole({
          name: '👑 Owner',
          color: 0xf1c40f,
          hoist: true,
          permissions: [PermissionFlagsBits.Administrator],
        });
        const adminRole = await findOrCreateRole({
          name: '🛡️ Admin',
          color: 0xe74c3c,
          hoist: true,
          permissions: [PermissionFlagsBits.Administrator],
        });
        const modRole = await findOrCreateRole({
          name: '⚔️ Moderator',
          color: 0x3498db,
          hoist: true,
          permissions: [
            PermissionFlagsBits.KickMembers,
            PermissionFlagsBits.BanMembers,
            PermissionFlagsBits.ModerateMembers,
            PermissionFlagsBits.ManageMessages,
            PermissionFlagsBits.ManageChannels,
          ],
        });
        await findOrCreateRole({
          name: '💎 VIP',
          color: 0x9b59b6,
          hoist: true,
        });
        const memberRole = await findOrCreateRole({
          name: '👤 Member',
          color: 0x2ecc71,
          hoist: true,
        });

        // Buat Role Minat (Self-Roles)
        const interestRoles = [];
        for (const r of theme.interestRoles) {
          const created = await findOrCreateRole({ name: r.name, color: r.color, hoist: false });
          interestRoles.push(created);
        }

        // Coba berikan role Owner ke pembuat server jika bot bisa
        const ownerMember = await guild.fetchOwner().catch(() => null);
        if (ownerMember && !ownerMember.roles.cache.has(ownerRole.id)) {
          await ownerMember.roles.add(ownerRole).catch(() => {});
        }

        // Helper buat/cari kategori & channel
        const findOrCreateCategory = async (name, permissionOverwrites = []) => {
          const existing = guild.channels.cache.find(
            (c) => c.type === ChannelType.GuildCategory && c.name === name,
          );
          if (existing) return existing;
          return guild.channels.create({
            name,
            type: ChannelType.GuildCategory,
            permissionOverwrites,
          });
        };

        const findOrCreateChannel = async ({ name, type = ChannelType.GuildText, parent, topic, permissionOverwrites, userLimit, bitrate }) => {
          const existing = guild.channels.cache.find(
            (c) => c.type === type && c.name === name && (!parent || c.parentId === parent.id),
          );
          if (existing) return { channel: existing, created: false };
          const ch = await guild.channels.create({
            name,
            type,
            parent: parent?.id,
            topic,
            permissionOverwrites,
            userLimit,
            bitrate,
          });
          return { channel: ch, created: true };
        };

        // Izin: Read-only untuk @everyone (hanya Admin/Mod/Bot yang bisa kirim pesan)
        const readOnlyPerms = [
          {
            id: guild.id,
            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory],
            deny: [PermissionFlagsBits.SendMessages],
          },
          {
            id: adminRole.id,
            allow: [PermissionFlagsBits.SendMessages],
          },
          {
            id: modRole.id,
            allow: [PermissionFlagsBits.SendMessages],
          },
          {
            id: interaction.client.user.id,
            allow: [PermissionFlagsBits.SendMessages, PermissionFlagsBits.ViewChannel],
          },
        ];

        // Izin: Privat khusus Staff
        const staffOnlyPerms = [
          {
            id: guild.id,
            deny: [PermissionFlagsBits.ViewChannel],
          },
          {
            id: ownerRole.id,
            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
          },
          {
            id: adminRole.id,
            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
          },
          {
            id: modRole.id,
            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
          },
          {
            id: interaction.client.user.id,
            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
          },
        ];

        // 2. Kategori INFORMASI (Read-only)
        const infoCat = await findOrCreateCategory('📌 INFORMASI', readOnlyPerms);
        const { channel: rulesCh, created: rulesCreated } = await findOrCreateChannel({
          name: '📜・rules',
          parent: infoCat,
          topic: 'Peraturan resmi server. Wajib dibaca semua member.',
          permissionOverwrites: readOnlyPerms,
        });
        const { channel: announceCh } = await findOrCreateChannel({
          name: '📢・pengumuman',
          parent: infoCat,
          topic: 'Info penting dan update terbaru server.',
          permissionOverwrites: readOnlyPerms,
        });
        const { channel: welcomeCh } = await findOrCreateChannel({
          name: '🎉・welcome-goodbye',
          parent: infoCat,
          topic: 'Sambutan otomatis untuk member baru & perpisahan.',
          permissionOverwrites: readOnlyPerms,
        });
        const { channel: selfRoleCh, created: selfRoleCreated } = await findOrCreateChannel({
          name: '🎭・ambil-role',
          parent: infoCat,
          topic: 'Klik tombol di bawah untuk mengambil role sesuai minatmu!',
          permissionOverwrites: readOnlyPerms,
        });

        // 3. Kategori KOMUNITAS
        const commCat = await findOrCreateCategory('💬 KOMUNITAS');
        await findOrCreateChannel({
          name: '💬・general-chat',
          parent: commCat,
          topic: 'Obrolan santai dan kenalan bersama semua member.',
        });
        for (const extra of theme.extraChannels) {
          await findOrCreateChannel({ name: extra.name, parent: commCat, topic: extra.topic });
        }
        await findOrCreateChannel({
          name: '🤖・bot-commands',
          parent: commCat,
          topic: 'Gunakan perintah bot seperti /rank, /daily, /work, /gamble, /rps di sini.',
        });
        const { channel: aiCh } = await findOrCreateChannel({
          name: '✨・ai-chat',
          parent: commCat,
          topic: 'Kirim pesan apa saja di sini untuk langsung mengobrol dengan AI Chatbot!',
        });
        await findOrCreateChannel({
          name: '🎉・giveaway',
          parent: commCat,
          topic: 'Event dan giveaway menarik untuk member server.',
        });

        // 4. Kategori VOICE LOUNGE (dengan pengaturan teknis berbeda tiap channel!)
        const voiceCat = await findOrCreateCategory('🔊 VOICE LOUNGE');
        const { channel: jtcCh } = await findOrCreateChannel({
          name: '➕ Buat Voice',
          type: ChannelType.GuildVoice,
          parent: voiceCat,
        });
        await findOrCreateChannel({
          name: '🔊 General Voice',
          type: ChannelType.GuildVoice,
          parent: voiceCat,
        });
        await findOrCreateChannel({
          name: '🎵 Ruang Musik',
          type: ChannelType.GuildVoice,
          parent: voiceCat,
          bitrate: 96000, // Audio lebih jernih untuk musik
        });
        await findOrCreateChannel({
          name: '🎮 Gaming Squad (Max 5)',
          type: ChannelType.GuildVoice,
          parent: voiceCat,
          userLimit: 5, // Pas 1 party 5 orang
        });
        const { channel: afkCh } = await findOrCreateChannel({
          name: '💤 AFK Room',
          type: ChannelType.GuildVoice,
          parent: voiceCat,
          permissionOverwrites: [
            {
              id: guild.id,
              deny: [PermissionFlagsBits.Speak],
            },
          ],
        });

        // Jadikan AFK Room sebagai Inactive Channel resmi server (15 menit)
        await guild.setAFKChannel(afkCh).catch(() => {});
        await guild.setAFKTimeout(900).catch(() => {});

        // 5. Kategori SUPPORT
        const supportCat = await findOrCreateCategory('🎫 SUPPORT', readOnlyPerms);
        const { channel: ticketCh, created: ticketCreated } = await findOrCreateChannel({
          name: '🎫・bantuan-tiket',
          parent: supportCat,
          topic: 'Klik tombol Buat Tiket untuk menghubungi admin/staff secara privat.',
          permissionOverwrites: readOnlyPerms,
        });

        // 6. Kategori STAFF AREA (Privat)
        const staffCat = await findOrCreateCategory('🔒 STAFF AREA', staffOnlyPerms);
        await findOrCreateChannel({
          name: '💬・staff-chat',
          parent: staffCat,
          topic: 'Diskusi internal khusus Owner, Admin, dan Moderator.',
          permissionOverwrites: staffOnlyPerms,
        });
        const { channel: logCh } = await findOrCreateChannel({
          name: '📜・bot-logs',
          parent: staffCat,
          topic: 'Log otomatis pesan dihapus & aktivitas moderasi.',
          permissionOverwrites: staffOnlyPerms,
        });

        // 7. Kirim Konten Otomatis (Rules, Panel Self-Role, & Panel Ticket)
        if (rulesCreated) {
          const rulesEmbed = createEmbed({
            title: `📜 Peraturan Server ${guild.name}`,
            description: [
              '**1. Saling Menghormati** — Dilarang menghina, bullying, SARA, atau toxic berlebihan.',
              '**2. Dilarang Spam & Promosi** — Jangan spam chat/mention atau promosi server lain tanpa izin.',
              '**3. Gunakan Channel Sesuai Fungsinya** — Gunakan `#bot-commands` untuk command bot dan `#ai-chat` untuk AI.',
              '**4. Konten Aman (SFW)** — Dilarang mengirim konten NSFW, gore, atau link mencurigakan/phishing.',
              '**5. Ikuti Arahan Staff** — Keputusan Owner/Admin/Moderator bersifat final demi kenyamanan bersama.',
            ].join('\n\n'),
            color: COLORS.PRIMARY,
            footer: { text: 'Dengan berada di server ini, kamu setuju mematuhi semua peraturan di atas.' },
          });
          await rulesCh.send({ embeds: [rulesEmbed] }).catch(() => {});
        }

        if (selfRoleCreated && interestRoles.length > 0) {
          const roleRow = new ActionRowBuilder().addComponents(
            interestRoles.map((r) =>
              new ButtonBuilder()
                .setCustomId(`selfrole_${r.id}`)
                .setLabel(r.name.slice(0, 80))
                .setStyle(ButtonStyle.Secondary),
            ),
          );
          const roleEmbed = createEmbed({
            title: `🎭 Pilih Role Minatmu (${theme.label})`,
            description:
              'Klik tombol di bawah untuk mengambil atau melepas role sesuai minatmu!\n\n' +
              interestRoles.map((r) => `• ${r}`).join('\n'),
            color: COLORS.INFO,
          });
          await selfRoleCh.send({ embeds: [roleEmbed], components: [roleRow] }).catch(() => {});
        }

        if (ticketCreated) {
          const ticketRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId('ticket_create')
              .setLabel('Buat Tiket')
              .setEmoji('🎫')
              .setStyle(ButtonStyle.Primary),
          );
          const ticketEmbed = createEmbed({
            title: '🎫 Pusat Bantuan / Ticket Support',
            description:
              'Butuh bantuan, ingin melapor, atau menghubungi staff?\nKlik tombol **Buat Tiket** di bawah untuk membuka channel privat bersama staff.',
            color: COLORS.PRIMARY,
          });
          await ticketCh.send({ embeds: [ticketEmbed], components: [ticketRow] }).catch(() => {});
        }

        // 8. Simpan Konfigurasi Otomatis Bot
        updateGuildConfig(guild.id, {
          welcomeChannelId: welcomeCh.id,
          aiChannelId: aiCh.id,
          logChannelId: logCh.id,
          autoRoleId: memberRole.id,
          joinToCreateChannelId: jtcCh.id,
        });

        const summaryEmbed = createEmbed({
          title: `🚀 Auto Setup Pro Selesai! (${theme.label})`,
          description: 'Struktur server profesional, izin channel, role, dan panel interaktif sudah selesai dibuat:',
          color: COLORS.SUCCESS,
          fields: [
            {
              name: '🎭 Roles Dibuat',
              value: `${ownerRole} ${adminRole} ${modRole} ${memberRole} + ${interestRoles.length} role minat`,
              inline: false,
            },
            {
              name: '📌 Informasi (Read-Only)',
              value: `${rulesCh}, ${announceCh}, ${welcomeCh}, ${selfRoleCh}`,
              inline: false,
            },
            {
              name: '💬 Komunitas & AI',
              value: `General Chat, Bot Commands, ${aiCh}, Giveaway, + 4 Voice Channels`,
              inline: false,
            },
            {
              name: '🎫 Support & 🔒 Staff Privat',
              value: `${ticketCh} (Panel Tiket aktif) & ${logCh} (khusus Staff)`,
              inline: false,
            },
            {
              name: '⚙️ Terhubung Otomatis',
              value: `Auto-Role: ${memberRole} • Welcome: ${welcomeCh} • AI: ${aiCh} • Logs: ${logCh} • Temp Voice: ${jtcCh}`,
              inline: false,
            },
          ],
          footer: { text: 'Tips: Posisikan role bot paling atas di Server Settings > Roles agar Auto-Role & Self-Role berjalan lancar!' },
        });

        await interaction.editReply({ embeds: [summaryEmbed] });
      } catch (error) {
        console.error('Auto setup error:', error);
        await interaction.editReply({
          embeds: [
            errorEmbed(
              'Auto Setup Gagal',
              'Pastikan bot memiliki izin `Administrator` (atau `Manage Channels` + `Manage Roles`).',
            ),
          ],
        });
      }
      return;
    }

    if (sub === 'channel') {
      const feature = interaction.options.getString('fitur');
      const channel = interaction.options.getChannel('target');

      const mapKey = {
        welcome: 'welcomeChannelId',
        ai: 'aiChannelId',
        logs: 'logChannelId',
        jtc: 'joinToCreateChannelId',
      };

      updateGuildConfig(guild.id, { [mapKey[feature]]: channel.id });
      return interaction.reply({
        embeds: [successEmbed('Channel Diperbarui', `Channel **${feature}** sekarang diatur ke ${channel}.`)],
      });
    }

    if (sub === 'autorole') {
      const role = interaction.options.getRole('role');
      updateGuildConfig(guild.id, { autoRoleId: role ? role.id : null });

      return interaction.reply({
        embeds: [
          role
            ? successEmbed('Auto-Role Diaktifkan', `Member baru akan otomatis mendapatkan role ${role}.`)
            : successEmbed('Auto-Role Dimatikan', 'Auto-role untuk member baru telah dinonaktifkan.'),
        ],
      });
    }

    if (sub === 'mode') {
      const mode = interaction.options.getString('pilihan');
      updateGuildConfig(guild.id, { mode });

      return interaction.reply({
        embeds: [
          mode === 'music'
            ? successEmbed(
                'Mode Khusus Musik Aktif 🎵',
                'Di server ini bot sekarang **hanya melayani perintah Musik** (`/play`, `/skip`, `/pause`, `/resume`, `/queue`, `/shuffle`, `/autoplay`, `/stop`).\nWelcome, Leveling, AI Chat, dan fitur lain dinonaktifkan agar tidak bentrok dengan bot lain.',
              )
            : successEmbed(
                'Mode Fitur Lengkap Aktif 🌟',
                'Semua fitur bot (Musik, AI, Leveling, Ekonomi, Moderasi, Welcome, Ticket, Temp Voice) kembali aktif di server ini!',
              ),
        ],
      });
    }

    if (sub === 'status') {
      const cfg = getGuildConfig(guild.id);
      const modeLabel = cfg.mode === 'music' ? '🎵 Khusus Musik (Music Only)' : '🌟 Fitur Lengkap (All-in-One)';
      const embed = createEmbed({
        title: `⚙️ Konfigurasi Server: ${guild.name}`,
        color: COLORS.INFO,
        fields: [
          {
            name: '🎛️ Mode Bot',
            value: modeLabel,
            inline: false,
          },
          {
            name: '🎉 Welcome Channel',
            value: cfg.welcomeChannelId ? `<#${cfg.welcomeChannelId}>` : 'Belum diatur (pakai System Channel)',
            inline: true,
          },
          {
            name: '✨ AI Chat Channel',
            value: cfg.aiChannelId ? `<#${cfg.aiChannelId}>` : 'Belum diatur',
            inline: true,
          },
          {
            name: '📜 Bot Logs Channel',
            value: cfg.logChannelId ? `<#${cfg.logChannelId}>` : 'Belum diatur',
            inline: true,
          },
          {
            name: '🎭 Auto-Role',
            value: cfg.autoRoleId ? `<@&${cfg.autoRoleId}>` : 'Nonaktif',
            inline: true,
          },
          {
            name: '➕ Temp Voice (Join-to-Create)',
            value: cfg.joinToCreateChannelId ? `<#${cfg.joinToCreateChannelId}>` : 'Belum diatur',
            inline: true,
          },
        ],
      });

      return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
    }
  },
};
