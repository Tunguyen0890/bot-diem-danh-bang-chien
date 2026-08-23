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
  TextInputStyle,
  PermissionFlagsBits,
  ChannelType
} = require('discord.js');
const fs = require('fs');
const path = require('path');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

const DATA_FILE = path.join(__dirname, 'diemdanh_data.json');

// Khởi tạo file data an toàn
function loadData() {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      fs.writeFileSync(DATA_FILE, JSON.stringify({}), 'utf8');
      return {};
    }
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    return data ? JSON.parse(data) : {};
  } catch (err) {
    console.error('Lỗi đọc file data:', err);
    return {};
  }
}

function saveData(data) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('Lỗi ghi file data:', err);
  }
}

// Danh sách Môn Phái
const FACTIONS = [
  { id: 'cuulinh', name: 'Cửu Linh', emoji: '🔮' },
  { id: 'thantung', name: 'Thần Tướng', emoji: '⚡' },
  { id: 'thiety', name: 'Thiết Y', emoji: '🛡️' },
  { id: 'toaimong', name: 'Toái Mộng', emoji: '🗡️' },
  { id: 'longngam', name: 'Long Ngâm', emoji: '🐉' },
  { id: 'tovan', name: 'Tố Vấn', emoji: '🌸' },
  { id: 'huyetha', name: 'Huyết Hà', emoji: '🩸' }
];

// Đăng ký Slash Commands
const commands = [
  new SlashCommandBuilder()
    .setName('tao-phien')
    .setDescription('Tạo phiên điểm danh Bang chiến mới')
    .addStringOption(opt => opt.setName('ten').setDescription('Tên phiên điểm danh').setRequired(true))
    .addIntegerOption(opt => opt.setName('gio').setDescription('Thời gian mở (tính theo giờ)').setRequired(true))
    .addChannelOption(opt => 
      opt.setName('kenh')
         .setDescription('Kênh gửi bảng điểm danh')
         .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
         .setRequired(true)
    ),

  new SlashCommandBuilder().setName('check-gay').setDescription('Check độ Gay').addUserOption(o => o.setName('user').setDescription('Người muốn check')),
  new SlashCommandBuilder().setName('check-beophi').setDescription('Check độ Béo Phì').addUserOption(o => o.setName('user').setDescription('Người muốn check')),
  new SlashCommandBuilder().setName('check-wibu').setDescription('Check độ Wibu').addUserOption(o => o.setName('user').setDescription('Người muốn check')),
  new SlashCommandBuilder().setName('check-haiten').setDescription('Check độ nghiện Hentai').addUserOption(o => o.setName('user').setDescription('Người muốn check'))
].map(cmd => cmd.toJSON());

const images = {
  'check-gay': 'https://media.giphy.com/media/26gspjl5bxzhxoBWw/giphy.gif',
  'check-beophi': 'https://media.giphy.com/media/dJe8wgptDLAv9Re78T/giphy.gif',
  'check-wibu': 'https://media.giphy.com/media/3o7TKSjRrfIPjeiVyM/giphy.gif',
  'check-haiten': 'https://media.giphy.com/media/6vE3Y7KE6ss8M/giphy.gif'
};

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

  const list = comments[type] || [];
  for (const item of list) {
    if (rate <= item.max) return item.text;
  }
  return 'Cực phẩm!';
}

client.once('ready', async () => {
  console.log(`✅ Bot đã kết nối thành công: ${client.user.tag}`);
  const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);
  try {
    await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
    console.log('⚡ Đã đăng ký hệ thống Slash Commands!');
  } catch (err) {
    console.error('Lỗi khi cài đặt lệnh:', err);
  }
});

client.on('interactionCreate', async interaction => {
  // 1. XỬ LÝ SLASH COMMANDS
  if (interaction.isChatInputCommand()) {
    const { commandName } = interaction;

    if (commandName === 'tao-phien') {
      try {
        const ten = interaction.options.getString('ten');
        const gio = interaction.options.getInteger('gio');
        const kenh = interaction.options.getChannel('kenh');

        // Kiểm tra quyền của Bot ở kênh mục tiêu
        const botMember = await interaction.guild.members.fetchMe();
        const permissions = kenh.permissionsFor(botMember);

        if (!permissions.has(PermissionFlagsBits.SendMessages) || !permissions.has(PermissionFlagsBits.EmbedLinks)) {
          return await interaction.reply({
            content: `❌ Bot không có quyền **Gửi tin nhắn** hoặc **Nhúng liên kết (Embed Links)** trong kênh <#${kenh.id}>. Vui lòng cấp quyền cho Bot rồi thử lại!`,
            ephemeral: true
          });
        }

        const sessionData = {
          title: ten,
          duration: gio,
          status: 'Dang mo diem danh',
          createdAt: new Date().toISOString(),
          users: {},
          baoBan: {}
        };

        const embed = buildMainEmbed(sessionData);
        const components = buildMainComponents();

        // Gửi bảng điểm danh
        const msg = await kenh.send({ embeds: [embed], components: components });

        // Lưu dữ liệu
        const db = loadData();
        db[msg.id] = sessionData;
        saveData(db);

        return await interaction.reply({ 
          content: `✅ Đã tạo phiên điểm danh thành công tại kênh <#${kenh.id}>!`, 
          ephemeral: true 
        });

      } catch (error) {
        console.error('Lỗi chi tiết khi tạo phiên:', error);
        if (!interaction.replied && !interaction.deferred) {
          return await interaction.reply({ 
            content: `❌ Lỗi khi tạo phiên: \`${error.message}\``, 
            ephemeral: true 
          });
        }
      }
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

  // 2. XỬ LÝ BUTTONS
  if (interaction.isButton()) {
    const msgId = interaction.message.id;
    const db = loadData();
    const session = db[msgId];

    if (!session && !interaction.customId.startsWith('admin_')) {
      return interaction.reply({ content: '❌ Phiên điểm danh này không tồn tại hoặc đã bị xóa.', ephemeral: true });
    }

    // Chọn Môn Phái
    if (interaction.customId.startsWith('faction_')) {
      const factionId = interaction.customId.replace('faction_', '');
      
      const modal = new ModalBuilder()
        .setCustomId(`modal_register_${factionId}`)
        .setTitle('Điểm Danh');

      const input = new TextInputBuilder()
        .setCustomId('ingame')
        .setLabel('Tên nhân vật trong game (In-game)')
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

      modal.addComponents(new ActionRowBuilder().addComponents(input));
      return interaction.showModal(modal);
    }

    // Hủy Đăng Ký
    if (interaction.customId === 'btn_huydk') {
      delete session.users[interaction.user.id];
      saveData(db);

      await interaction.message.edit({ embeds: [buildMainEmbed(session)] });
      return interaction.reply({ content: '🗑️ Đã xóa thông tin điểm danh của bạn!', ephemeral: true });
    }

    // Báo Bận
    if (interaction.customId === 'btn_baoban') {
      const modal = new ModalBuilder()
        .setCustomId('modal_baoban')
        .setTitle('Báo Bận');

      const inputIngame = new TextInputBuilder()
        .setCustomId('ingame')
        .setLabel('Tên In-game')
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

      const inputReason = new TextInputBuilder()
        .setCustomId('reason')
        .setLabel('Lý do bận')
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(true);

      modal.addComponents(
        new ActionRowBuilder().addComponents(inputIngame),
        new ActionRowBuilder().addComponents(inputReason)
      );
      return interaction.showModal(modal);
    }

    // Hủy Bận
    if (interaction.customId === 'btn_huyban') {
      delete session.baoBan[interaction.user.id];
      saveData(db);

      await interaction.message.edit({ embeds: [buildMainEmbed(session)] });
      return interaction.reply({ content: '🗑️ Đã xóa thông tin báo bận!', ephemeral: true });
    }

    // Quản Lý Admin
    if (interaction.customId === 'btn_quanly') {
      if (!interaction.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
        return interaction.reply({ content: '❌ Bạn không có quyền quản lý phiên điểm danh này!', ephemeral: true });
      }

      const adminRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`admin_dongphien_${msgId}`).setLabel('Đóng Phiên').setStyle(ButtonStyle.Danger),
        new ButtonBuilder().setCustomId(`admin_doiten_${msgId}`).setLabel('Đổi Tên').setStyle(ButtonStyle.Secondary)
      );

      return interaction.reply({
        content: '⚙️ **Bảng điều khiển admin:**',
        components: [adminRow],
        ephemeral: true
      });
    }

    // Admin: Đóng Phiên
    if (interaction.customId.startsWith('admin_dongphien_')) {
      const targetMsgId = interaction.customId.replace('admin_dongphien_', '');
      const targetSession = db[targetMsgId];

      if (!targetSession) return interaction.reply({ content: '❌ Không tìm thấy phiên!', ephemeral: true });

      targetSession.status = 'Da dong';
      saveData(db);

      try {
        const channel = interaction.channel;
        const targetMsg = await channel.messages.fetch(targetMsgId);
        await targetMsg.edit({ embeds: [buildMainEmbed(targetSession)], components: [] });
      } catch (e) {}

      const summaryEmbed = buildSummaryEmbed(targetSession);

      await interaction.reply({ content: '🔒 Phiên điểm danh đã được ĐÓNG bởi Quản Trị Viên!', ephemeral: true });
      return interaction.channel.send({
        content: '📊 **TỔNG KẾT ĐIỂM DANH:** ' + targetSession.title,
        embeds: [summaryEmbed]
      });
    }

    // Admin: Đổi Tên
    if (interaction.customId.startsWith('admin_doiten_')) {
      const targetMsgId = interaction.customId.replace('admin_doiten_', '');
      const modal = new ModalBuilder()
        .setCustomId(`modal_doiten_${targetMsgId}`)
        .setTitle('Đổi Tên Phiên');

      const input = new TextInputBuilder()
        .setCustomId('new_title')
        .setLabel('Tên phiên mới')
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

      modal.addComponents(new ActionRowBuilder().addComponents(input));
      return interaction.showModal(modal);
    }
  }

  // 3. XỬ LÝ MODALS
  if (interaction.isModalSubmit()) {
    const db = loadData();

    // Đăng ký Môn phái
    if (interaction.customId.startsWith('modal_register_')) {
      const factionId = interaction.customId.replace('modal_register_', '');
      const ingame = interaction.fields.getTextInputValue('ingame');
      const msgId = interaction.message.id;
      const session = db[msgId];

      if (session) {
        delete session.baoBan[interaction.user.id];
        session.users[interaction.user.id] = { factionId, inGame: ingame };
        saveData(db);

        await interaction.message.edit({ embeds: [buildMainEmbed(session)] });
        return interaction.reply({ content: '📝 Đã ghi nhận điểm danh!', ephemeral: true });
      }
    }

    // Báo Bận
    if (interaction.customId === 'modal_baoban') {
      const ingame = interaction.fields.getTextInputValue('ingame');
      const reason = interaction.fields.getTextInputValue('reason');
      const msgId = interaction.message.id;
      const session = db[msgId];

      if (session) {
        delete session.users[interaction.user.id];
        session.baoBan[interaction.user.id] = { inGame: ingame, reason };
        saveData(db);

        await interaction.message.edit({ embeds: [buildMainEmbed(session)] });
        return interaction.reply({ content: '📝 Đã ghi nhận báo bận!', ephemeral: true });
      }
    }

    // Admin Đổi Tên
    if (interaction.customId.startsWith('modal_doiten_')) {
      const targetMsgId = interaction.customId.replace('modal_doiten_', '');
      const newTitle = interaction.fields.getTextInputValue('new_title');
      const session = db[targetMsgId];

      if (session) {
        session.title = newTitle;
        saveData(db);

        try {
          const targetMsg = await interaction.channel.messages.fetch(targetMsgId);
          await targetMsg.edit({ embeds: [buildMainEmbed(session)] });
        } catch (e) {}

        return interaction.reply({ content: '✅ Đã cập nhật tên phiên điểm danh!', ephemeral: true });
      }
    }
  }
});

// BUILD EMBED CHÍNH
function buildMainEmbed(session) {
  const isClosed = session.status === 'Da dong';
  const totalCount = Object.keys(session.users).length;
  const timeStr = new Date().toLocaleTimeString('vi-VN', { hour12: false });

  let desc = `**Trạng thái**\n${isClosed ? '🔴 Đã đóng' : '🟢 Đang mở điểm danh'}\n\n`;
  desc += `**Thời hạn**\n${session.duration} ngày tới\n\n`;
  desc += `**Tổng số tham gia: ${totalCount} người**\n\n`;

  const baoBanKeys = Object.keys(session.baoBan);
  if (baoBanKeys.length > 0) {
    desc += `⚠️ **Báo bận (${baoBanKeys.length})**\n`;
    baoBanKeys.forEach((uid, index) => {
      const item = session.baoBan[uid];
      desc += `${index + 1}. <@${uid}> | ${item.inGame} (${item.reason})\n`;
    });
    desc += `\n`;
  }

  FACTIONS.forEach(f => {
    const members = Object.entries(session.users).filter(([_, u]) => u.factionId === f.id);
    desc += `${f.emoji} **${f.name} (${members.length})**\n`;
    if (members.length === 0) {
      desc += `Trống\n`;
    } else {
      members.forEach(([uid, u], index) => {
        desc += `${index + 1}. <@${uid}>. (${u.inGame})\n`;
      });
    }
    desc += `\n`;
  });

  desc += `*Cập nhật lúc: ${timeStr}*`;

  return new EmbedBuilder()
    .setTitle(`⚔️ ${session.title}`)
    .setDescription(desc)
    .setColor(isClosed ? 0xef4444 : 0x38bdf8);
}

// BUILD BUTTONS CHÍNH
function buildMainComponents() {
  const row1 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('faction_cuulinh').setLabel('Cửu Linh').setEmoji('🔮').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId('faction_thantung').setLabel('Thần Tướng').setEmoji('⚡').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId('faction_thiety').setLabel('Thiết Y').setEmoji('🛡️').setStyle(ButtonStyle.Primary)
  );

  const row2 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('faction_toaimong').setLabel('Toái Mộng').setEmoji('🗡️').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId('faction_longngam').setLabel('Long Ngâm').setEmoji('🐉').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId('faction_tovan').setLabel('Tố Vấn').setEmoji('🌸').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId('faction_huyetha').setLabel('Huyết Hà').setEmoji('🩸').setStyle(ButtonStyle.Primary)
  );

  const row3 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('btn_huydk').setLabel('Hủy ĐK').setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId('btn_baoban').setLabel('Báo Bận').setStyle(ButtonStyle.Warning),
    new ButtonBuilder().setCustomId('btn_huyban').setLabel('Hủy Bận').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('btn_quanly').setLabel('Quản Lý').setStyle(ButtonStyle.Secondary)
  );

  return [row1, row2, row3];
}

// BUILD EMBED TỔNG KẾT
function buildSummaryEmbed(session) {
  const totalUsers = Object.keys(session.users).length;
  const totalBaoBan = Object.keys(session.baoBan).length;
  const timeStr = new Date().toLocaleTimeString('vi-VN', { hour12: false });

  let desc = `📌 *Phiên điểm danh đã chính thức đóng. Thống kê chi tiết như sau:*\n\n`;
  desc += `👤 **Tổng người tham gia**\n${totalUsers} thành viên\n\n`;
  desc += `⚠️ **Tổng số báo bận**\n${totalBaoBan} người\n\n`;
  desc += `⚔️ **Thống kê theo môn phái**\n`;

  FACTIONS.forEach(f => {
    const count = Object.values(session.users).filter(u => u.factionId === f.id).length;
    desc += `${f.emoji} **${f.name}:** ${count} người\n`;
  });

  desc += `\n*Tổng kết lúc: ${timeStr}*`;

  return new EmbedBuilder()
    .setTitle(`📊 TỔNG KẾT ĐIỂM DANH: ${session.title}`)
    .setDescription(desc)
    .setColor(0x22c55e);
}

client.login(process.env.TOKEN);
