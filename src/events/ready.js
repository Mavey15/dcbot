const { Events, ActivityType } = require('discord.js');

module.exports = {
  name: Events.ClientReady,
  once: true,
  execute(client) {
    console.log(`🤖 Bot berhasil online sebagai ${client.user.tag}!`);
    console.log(`📦 Memuat ${client.commands.size} slash command.`);
    console.log(`🌐 Aktif di ${client.guilds.cache.size} server.`);

    const activities = [
      { name: '/help untuk bantuan', type: ActivityType.Listening },
      { name: `${client.guilds.cache.size} server`, type: ActivityType.Watching },
      { name: 'Discord.js v14', type: ActivityType.Playing },
    ];

    let index = 0;
    const updateActivity = () => {
      const activity = activities[index % activities.length];
      client.user.setActivity(activity.name, { type: activity.type });
      index++;
    };

    updateActivity();
    setInterval(updateActivity, 30_000);
  },
};
