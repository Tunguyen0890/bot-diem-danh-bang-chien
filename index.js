const { 
  Client, 
  GatewayIntentBits, 
  SlashCommandBuilder, 
  REST, 
  Routes, 
  EmbedBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  ModalBuilder, 
  TextInputBuilder, 
  TextInputStyle 
} = require('discord.js');
const fs = require('fs');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

const DATA_FILE = './diemdanh_data.json';
if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, JSON.stringify({}));

// Danh sách Slash Commands
const commands = [
  new SlashCommandBuilder().setName('tao-phien').setDescription('Tạo phiên điểm danh Bang chiến mới'),
  new SlashCommandBuilder().setName('check-gay').setDescription('Check độ Gay').addUserOption(opt => opt.setName('user').setDescription('Người muốn check')),
  new SlashCommandBuilder().setName('check-beophi').setDescription('Check độ Béo Phì').addUserOption(opt => opt.setName('user').setDescription('Người muốn check')),
  new SlashCommandBuilder().setName('check-wibu').setDescription('Check độ Wibu').addUserOption(opt => opt.setName('user').setDescription('Người muốn check')),
  new SlashCommandBuilder().setName('check-haiten').setDescription('Check độ nghiện Hentai').addUserOption(opt => opt.setName('user').setDescription('Người muốn check'))
].map(cmd => cmd.toJSON());

// Ảnh minh họa theo từng loại check
const images = {
  'check-gay': 'https://media.giphy.com/media/26gspjl5bxzhxoBWw/giphy.gif',
  'check-beophi': 'https://media.giphy.com/media/dJe8wgptDLAv9Re78T/giphy.gif',
  'check-wibu': 'https://media.giphy.com/media/3o7TKSjRrfIPjeiVyM/giphy.gif',
  'check-haiten': 'https://media.giphy.com/media/6vE3Y7KE6ss8M/giphy.gif'
};

// Bảng nhận xét mỏ hỗn theo %
function getComment(type, rate) {
  const comments = {
    'check-gay': [
      { max: 20, text: 'Thẳng như thước kẻ! Nhưng coi chừng thước nhựa uốn dẻo nha con.' },
      { max: 50, text: 'Hơi bóng bẩy rồi đấy, nhìn trai đẹp mắt sáng rỡ đúng không?' },
      { max: 80, text: 'Gần chạm đỉnh rồi! Thèm dầu ăn với muốn thông đít lắm rồi chứ gì?' },
      { max: 100, text: 'Gay chúa! Nhìn đâu cũng ra con mồi, né xa cớm ra không nó đè!' }
    ],
    'check-beophi': [
      { max: 20, text: 'Người như con mắm xức dầu, gió thổi cái bay màu luôn!' },
      { max: 50, text: 'Thịt thà vừa tầm, nhưng bớt nạp trà sữa lại không nọng cằm nó rớt.' },
      { max: 80, text: 'Thở thôi cũng mập! Đi đứng nhẹ nhàng thôi không gãy sàn nhà người ta.' },
      { max: 100, text: 'Tròn như cái lu! Béo cừu béo lợn, lỡ té một cái chắc lăn 3 vòng mới dừng.' }
    ],
    'check-wibu': [
      { max: 20, text: 'Người bình thường, chưa bị tha hóa bởi hoạt hình Nhật Bản.' },
      { max: 50, text: 'Thỉnh thoảng hay mơ làm Main anime, tối ngủ hay gáy Kimochi đúng không?' },
      { max: 80, text: 'Wibu chúa! Đốt tiền mua gối ôm gái 2D, mở miệng ra là Yamete Kudasai.' },
      { max: 100, text: 'Hết cứu! Mùi mồ hôi chua lè chuẩn Wibu lâu năm, tha cho đời đi con.' }
    ],
    'check-haiten': [
      { max: 20, text: 'Tâm trong sáng như nước lèo, chưa biết mùi đen tối là gì.' },
      { max: 50, text: 'Đã biết mò link, thuộc vài mã code 6 số rồi đấy nha cháu.' },
      { max: 80, text: 'Đầu óc toàn đen tối! Tay lúc nào cũng để dưới bàn, quay tay ít thôi xước đít!' },
      { max: 100, text: 'Thần dâm tái thế! Mắt thâm như gấu trúc, kho tài liệu 200GB hentai chứ gì?' }
    ]
  };

  const list = comments[type];
  for (const item of list) {
    if (rate <= item.max) return item.text;
  }
  return 'Cực phẩm!';
}

client.once('ready', async () => {
  console.log(`✅ Bot đã đăng nhập thành công: ${client.user.tag}`);
  const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);
  try {
    await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
    console.log('⚡ Đã cập nhật xong các Slash Commands!');
  } catch (err) {
    console.error('Lỗi đăng ký lệnh:', err);
  }
});

client.on('interactionCreate', async interaction => {
  if (interaction.isChatInputCommand()) {
    const { commandName } = interaction;

    if (commandName === 'tao-phien') {
      const data = JSON.parse(fs.readFileSync(DATA_FILE));
      data[interaction.channelId] = { co_mat: [], xin_vang: [] };
      fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));

      const embed = new EmbedBuilder()
        .setTitle('⚔️ ĐIỂM DANH BANG CHIẾN')
        .setDescription('Vui lòng chọn nút bên dưới để điểm danh trạng thái tham gia của bạn!')
        .setColor(0x38bdf8)
        .addFields(
          { name: '✅ Có mặt (0)', value: 'Chưa có ai', inline: true },
          { name: '❌ Xin vắng (0)', value: 'Chưa có ai', inline: true }
        );

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('dd_comat').setLabel('Có mặt').setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId('dd_xinvang').setLabel('Xin vắng').setStyle(ButtonStyle.Danger)
      );

      return interaction.reply({ embeds: [embed], components: [row] });
    }

    if (['check-gay', 'check-beophi', 'check-wibu', 'check-haiten'].includes(commandName)) {
      const target = interaction.options.getUser('user') || interaction.user;
      const rate = Math.floor(Math.random() * 101);
      const comment = getComment(commandName, rate);
      
      const titles = {
        'check-gay': '🌈 CHECK ĐỘ GAY',
        'check-beophi': '🍔 CHECK ĐỘ BÉO PHÌ',
        'check-wibu': '🌸 CHECK ĐỘ WIBU',
        'check-haiten': '🔞 CHECK ĐỘ HENTAI'
      };

      const embed = new EmbedBuilder()
        .setTitle(titles[commandName])
        .setDescription(`Đối tượng: ${target}\nTỉ lệ: **${rate}%**\n\n💬 *${comment}*`)
        .setThumbnail(target.displayAvatarURL({ dynamic: true }))
        .setImage(images[commandName])
        .setColor(rate > 50 ? 0xff0055 : 0x00ff88);

      return interaction.reply({ embeds: [embed] });
    }
  }

  if (interaction.isButton()) {
    const data = JSON.parse(fs.readFileSync(DATA_FILE));
    const channelData = data[interaction.channelId] || { co_mat: [], xin_vang: [] };

    if (interaction.customId === 'dd_comat') {
      channelData.co_mat = channelData.co_mat.filter(u => u.id !== interaction.user.id);
      channelData.xin_vang = channelData.xin_vang.filter(u => u.id !== interaction.user.id);
      channelData.co_mat.push({ id: interaction.user.id, name: interaction.user.username });
      
      data[interaction.channelId] = channelData;
      fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));

      await updateEmbed(interaction, channelData);
      return interaction.reply({ content: '✅ Bạn đã điểm danh **Có mặt**!', ephemeral: true });
    }

    if (interaction.customId === 'dd_xinvang') {
      const modal = new ModalBuilder()
        .setCustomId('modal_lydo')
        .setTitle('Lý do xin vắng');
      
      const input = new TextInputBuilder()
        .setCustomId('input_lydo')
        .setLabel('Ghi rõ lý do xin vắng')
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(true);

      modal.addComponents(new ActionRowBuilder().addComponents(input));
      return interaction.showModal(modal);
    }
  }

  if (interaction.isModalSubmit() && interaction.customId === 'modal_lydo') {
    const lydo = interaction.fields.getTextInputValue('input_lydo');
    const data = JSON.parse(fs.readFileSync(DATA_FILE));
    const channelData = data[interaction.channelId] || { co_mat: [], xin_vang: [] };

    channelData.co_mat = channelData.co_mat.filter(u => u.id !== interaction.user.id);
    channelData.xin_vang = channelData.xin_vang.filter(u => u.id !== interaction.user.id);
    channelData.xin_vang.push({ id: interaction.user.id, name: interaction.user.username, lydo });

    data[interaction.channelId] = channelData;
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));

    await updateEmbed(interaction, channelData);
    return interaction.reply({ content: '❌ Đã ghi nhận lý do vắng của bạn!', ephemeral: true });
  }
});

async function updateEmbed(interaction, channelData) {
  const coMatText = channelData.co_mat.length > 0 ? channelData.co_mat.map(u => `<@${u.id}>`).join('\n') : 'Chưa có ai';
  const xinVangText = channelData.xin_vang.length > 0 ? channelData.xin_vang.map(u => `<@${u.id}> (${u.lydo})`).join('\n') : 'Chưa có ai';

  const embed = new EmbedBuilder()
    .setTitle('⚔️ ĐIỂM DANH BANG CHIẾN')
    .setDescription('Vui lòng chọn nút bên dưới để điểm danh trạng thái tham gia của bạn!')
    .setColor(0x38bdf8)
    .addFields(
      { name: `✅ Có mặt (${channelData.co_mat.length})`, value: coMatText, inline: true },
      { name: `❌ Xin vắng (${channelData.xin_vang.length})`, value: xinVangText, inline: true }
    );

  await interaction.message.edit({ embeds: [embed] });
}

client.login(process.env.TOKEN);
