const { REST, Routes } = require('discord.js');
const TOKEN = process.env.TOKEN || 'YOUR_BOT_TOKEN_HERE';
const rest = new REST({ version: '10' }).setToken(TOKEN);

(async () => {
  try {
    console.log('🔄 Đang tiến hành dọn dẹp các Slash Command bị trùng...');
    const currentUser = await rest.get(Routes.user());
    const clientId = currentUser.id;

    await rest.put(Routes.applicationCommands(clientId), { body: [] });
    console.log('🧹 Đã xóa sạch Global Commands cũ!');

    const guilds = await rest.get(Routes.userGuilds());
    for (const guild of guilds) {
      await rest.put(Routes.applicationGuildCommands(clientId, guild.id), { body: [] });
      console.log(`🧹 Đã xóa Guild Commands ở Server ID: ${guild.id}`);
    }

    console.log('✨ Dọn dẹp hoàn tất! Giờ bạn có thể bật lại bot.');
  } catch (error) {
    console.error('❌ Lỗi:', error);
  }
})();
