const { REST, Routes } = require('discord.js');

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    console.log('Đang xóa tất cả các lệnh...');

    // 1. Xóa tất cả GLOBAL commands
    await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), { body: [] });
    console.log('Đã xóa sạch Global Commands!');

    // 2. Xóa tất cả GUILD commands (thay GUILD_ID bằng ID server của bạn nếu có)
    // await rest.put(Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID), { body: [] });

  } catch (error) {
    console.error(error);
  }
})();
