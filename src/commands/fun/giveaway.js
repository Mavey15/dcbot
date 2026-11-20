const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  MessageFlags,
} = require('discord.js');
const { createEmbed, errorEmbed, COLORS } = require('../../utils/embed');

function parseDuration(input) {
  const match = input.trim().toLowerCase().match(/^(\d+)\s*(s|m|h|d)$/);
  if (!match) return null;
  const val = parseInt(match[1], 10);
  const mult = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 };
  return val * mult[match[2]];
}

module.exports = {
  category: 'Fun',
  cooldown: 5,
  data: new SlashCommandBuilder()
    .setName('giveaway')
    .setDescription('Buat giveaway interaktif dengan tombol Ikut Giveaway')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageEvents)
    .addStringOption((opt) =>
      opt.setName('durasi').setDescription('Durasi giveaway (contoh: 30s, 5m, 1h)').setRequired(true),
    )
    .addStringOption((opt) => opt.setName('hadiah').setDescription('Hadiah giveaway').setRequired(true))
    .addIntegerOption((opt) =>
      opt.setName('pemenang').setDescription('Jumlah pemenang (default: 1)').setMinValue(1).setMaxValue(10),
    ),
  async execute(interaction) {
    const durationStr = interaction.options.getString('durasi');
    const prize = interaction.options.getString('hadiah');
    const winnerCount = interaction.options.getInteger('pemenang') || 1;
    const ms = parseDuration(durationStr);

    if (!ms || ms < 10_000 || ms > 7 * 86_400_000) {
      return interaction.reply({
        embeds: [errorEmbed('Durasi Tidak Valid', 'Gunakan format seperti `30s`, `5m`, `1h`, atau `1d` (min 10 detik, maks 7 hari).')],
        flags: MessageFlags.Ephemeral,
      });
    }

    const endTs = Math.floor((Date.now() + ms) / 1000);
    const participants = new Set();

    const buildEmbed = (ended = false, winners = []) => {
      if (!ended) {
        return createEmbed({
          title: `🎉 GIVEAWAY: ${prize}`,
          description: [
            `Klik tombol **Ikut Giveaway** di bawah untuk berpartisipasi!`,
            '',
            `⏰ Berakhir: <t:${endTs}:R> (<t:${endTs}:T>)`,
            `🏆 Jumlah Pemenang: **${winnerCount}**`,
            `👥 Peserta saat ini: **${participants.size}**`,
          ].join('\n'),
          color: COLORS.PRIMARY,
          footer: { text: `Diselenggarakan oleh ${interaction.user.tag}` },
        });
      }

      const winnerText =
        winners.length > 0
          ? winners.map((id) => `<@${id}>`).join(', ')
          : 'Tidak ada peserta yang ikut.';

      return createEmbed({
        title: `🎊 GIVEAWAY SELESAI: ${prize}`,
        description: `🏆 **Pemenang:** ${winnerText}\n👥 Total Peserta: **${participants.size}**`,
        color: winners.length > 0 ? COLORS.SUCCESS : COLORS.ERROR,
        footer: { text: `Diselenggarakan oleh ${interaction.user.tag}` },
      });
    };

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('giveaway_join')
        .setLabel('Ikut Giveaway (0)')
        .setEmoji('🎉')
        .setStyle(ButtonStyle.Success),
    );

    const response = await interaction.reply({
      embeds: [buildEmbed(false)],
      components: [row],
      withResponse: true,
    });
    const message = response.resource.message;

    const collector = message.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: ms,
    });

    collector.on('collect', async (btn) => {
      if (participants.has(btn.user.id)) {
        participants.delete(btn.user.id);
        await btn.reply({ content: '❌ Kamu keluar dari giveaway ini.', flags: MessageFlags.Ephemeral });
      } else {
        participants.add(btn.user.id);
        await btn.reply({ content: '🎉 Kamu berhasil terdaftar di giveaway ini!', flags: MessageFlags.Ephemeral });
      }

      const updatedRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('giveaway_join')
          .setLabel(`Ikut Giveaway (${participants.size})`)
          .setEmoji('🎉')
          .setStyle(ButtonStyle.Success),
      );
      await message.edit({ embeds: [buildEmbed(false)], components: [updatedRow] }).catch(() => {});
    });

    collector.on('end', async () => {
      const pool = Array.from(participants);
      const winners = [];
      while (winners.length < winnerCount && pool.length > 0) {
        const idx = Math.floor(Math.random() * pool.length);
        winners.push(pool.splice(idx, 1)[0]);
      }

      await message.edit({ embeds: [buildEmbed(true, winners)], components: [] }).catch(() => {});

      if (winners.length > 0) {
        await interaction.channel
          .send(`🎉 Selamat kepada ${winners.map((id) => `<@${id}>`).join(', ')} yang memenangkan **${prize}**!`)
          .catch(() => {});
      }
    });
  },
};
