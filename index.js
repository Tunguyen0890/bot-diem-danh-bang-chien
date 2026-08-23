const { 
  Client, 
  GatewayIntentBits, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  ModalBuilder, 
  TextInputBuilder, 
  TextInputStyle, 
  EmbedBuilder, 
  Events,
  SlashCommandBuilder,
  REST,
  Routes,
  PermissionsBitField,
  ChannelType
} = require('discord.js');

// ⚠️ Bot sử dụng Process Environment Variable TOKEN
const TOKEN = process.env.TOKEN || 'YOUR_BOT_TOKEN_HERE';

const BANNER_IMAGE = 'https://i.giphy.com/media/v1.Y2lkPTc5MGI3NjExM3Z2eDFwZXRyNWJ1aGhybnMwbWN5OHAwMmdtbHJvMHFvMm5mMnF0dyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/L2XhHcmM55533fYnmA/giphy.gif';

// 💡 Điền ID Emoji Discord của bạn vào đây (Ví dụ: '123456789012345678')
const CLASSES = [
  { id: 'culinh', name: 'Cửu Linh', emoji: '1540995232848420926' },
  { id: 'thantuong', name: 'Thần Tướng', emoji: '1540995230877097984' },
  { id: 'thiety', name: 'Thiết Y', emoji: '1540995240691896431' },
  { id: 'toaimong', name: 'Toái Mộng', emoji: '1540995237084798986' },
  { id: 'longngam', name: 'Long Ngâm', emoji: '1540995228448723025' },
  { id: 'tovan', name: 'Tố Vấn', emoji: '1540995234840846437' },
  { id: 'huyetha', name: 'Huyết Hà', emoji: '1540995238909321327' }
];

// GIF Anime Minh Họa cho từng lệnh Check
const CHECK_IMAGES = {
  gay: 'https://media.giphy.com/media/26gspjl5bxzhxoBWw/giphy.gif',
  les: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExOHYyOXhyNm1iZ3VreGtkbmdyNnk5ejFudGtrZTRldXlsNjcxMHVndyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/l0IybQ6l8J454o52w/giphy.gif',
  beophi: 'https://media.giphy.com/media/dJe8wgptDLAv9Re78T/giphy.gif',
  wibu: 'https://media.giphy.com/media/3o7TKSjRrfIPjeiVyM/giphy.gif',
  haiten: 'https://media.giphy.com/media/6vE3Y7KE6ss8M/giphy.gif',
  saygex: 'https://media.giphy.com/media/3o7TKzb326hYin7JFS/giphy.gif'
};

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

const activeSessions = new Map();

process.on('unhandledRejection', (error) => console.error('Hệ thống bắt Unhandled Rejection:', error));
process.on('uncaughtException', (error) => console.error('Hệ thống bắt Uncaught Exception:', error));

// Hàm hiển thị Emoji (ID hoặc Unicode) trên Embed
function getEmojiString(emoji) {
  if (!emoji) return '⚔️';
  return /^\d+$/.test(emoji) ? `<:custom:${emoji}>` : emoji;
}

// Hàm tính % cố định dựa trên User ID
function getPercentage(userId, type) {
  let hash = 0;
  const str = userId + type;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash) % 101;
}

function createProgressBar(percent, emoji = '🏳️‍🌈') {
  const total = 10;
  const progress = Math.round((percent / 100) * total);
  const empty = total - progress;
  return `[${emoji.repeat(progress)}${'⬛'.repeat(empty)}] **${percent}%**`;
}

// Hàm trả về comment mặn mòi, bựa cho từng loại
function getCheckComment(type, percent) {
  const comments = {
    gay: [
      { max: 15, text: 'Thẳng như thước kẻ! Nhưng coi chừng thước nhựa uốn dẻo nha con.' },
      { max: 45, text: 'Nhìn trai đẹp bắt đầu thấy sáng rỡ mắt lên rồi đấy, bớt "dẻo" lại!' },
      { max: 75, text: 'Bóng gồng quá cha ơi! Mùi dầu ăn nép sau lưng bốc lên nồng nặc rồi!' },
      { max: 100, text: 'Gay chúa hạ sang! Nhìn đâu cũng ra con mồi, né xa cớm ra kẻo nó đè!' }
    ],
    les: [
      { max: 15, text: 'Gái thẳng băng, chưa biết mùi bách hợp là cái gì.' },
      { max: 45, text: 'Hay ngắm mông ngực chị em trong nhóm đúng không? Có vết rồi nha!' },
      { max: 75, text: 'Thích liếm má gái đẹp, mê con gái hơn mê con trai rõ mười mươi!' },
      { max: 100, text: 'Nữ vương Bách Hợp! Trai ghen tị vì chị lượm hết gái đẹp trong server!' }
    ],
    beophi: [
      { max: 15, text: 'Người như con mắm xức dầu, gió thổi nhẹ cái bay màu luôn!' },
      { max: 45, text: 'Thịt thà vừa tầm, nhưng bớt nạp trà sữa lại không nọng cằm nó rớt.' },
      { max: 75, text: 'Thở thôi cũng mập! Đi đứng nhẹ nhàng không gãy sàn nhà người ta.' },
      { max: 100, text: 'Tròn như cái lu! Béo cừu béo lợn, lỡ té một cái lăn 3 vòng mới dừng!' }
    ],
    wibu: [
      { max: 15, text: 'Người bình thường, chưa bị tha hóa bởi hoạt hình Nhật Bản.' },
      { max: 45, text: 'Thỉnh thoảng hay mơ làm Main anime, tối ngủ hay gáy Kimochi đúng không?' },
      { max: 80, text: 'Wibu chúa! Đốt tiền mua gối ôm gái 2D, mở miệng ra là Yamete Kudasai.' },
      { max: 100, text: 'Hết cứu! Mùi mồ hôi chua lè chuẩn Wibu lâu năm, tha cho đời đi con.' }
    ],
    haiten: [
      { max: 15, text: 'Tâm trong sáng như nước lèo, chưa biết mùi đen tối là gì.' },
      { max: 45, text: 'Đã biết mò link, thuộc vài mã code 6 số rồi đấy nha cháu.' },
      { max: 75, text: 'Đầu óc toàn đen tối! Tay lúc nào cũng để dưới bàn, quay tay ít thôi xước đít!' },
      { max: 100, text: 'Thần dâm tái thế! Mắt thâm như gấu trúc, kho tài liệu 200GB hentai chứ gì?' }
    ],
    saygex: [
      { max: 15, text: 'Tâm hồn thanh tịnh, chưa bao giờ mơ thấy cảnh đấu kiếm.' },
      { max: 45, text: 'Bắt đầu có máu Say Gex trong người, hay liếc mông mấy thằng anh em.' },
      { max: 75, text: 'Đam mê thông đít đấu kiếm nồng cháy! Thèm cảm giác mạnh dữ lắm rồi!' },
      { max: 100, text: 'BẬC THẦY SAY GEX! Địch hay đệ cũng cởi quần ra đâm tuốt, né xa 10m!' }
    ]
  };

  const list = comments[type] || [];
  for (const item of list) {
    if (percent <= item.max) return item.text;
  }
  return 'Cực phẩm mặn mòi!';
}

function buildEmbed(session) {
  let total = 0;
  CLASSES.forEach(c => total += (session.members?.[c.id]?.length || 0));

  const embed = new EmbedBuilder()
    .setTitle(`⚔️ BẢNG BÁO DANH: ${session.title}`)
    .setThumbnail(BANNER_IMAGE)
    .setColor(session.isOpen ? '#0099FF' : '#FF0000')
    .addFields(
      { name: '📌 Trạng thái', value: session.isOpen ? '🟢 **ĐANG MỞ BÁO DANH**' : '🔴 **ĐÃ ĐÓNG**', inline: true },
      { name: '⏳ Thời hạn', value: session.expiresAt ? `<t:${Math.floor(session.expiresAt / 1000)}:R>` : 'Không giới hạn', inline: true },
      { name: `👥 Tổng số tham gia: **${total}** người`, value: '─────────────────────────────', inline: false }
    );

  if (session.busyList?.length > 0) {
    const busyText = session.busyList.map((b, i) => `${i + 1}. <@${b.userId}> | **${b.ingame}** (${b.reason})`).join('\n');
    embed.addFields({ name: `⚠️ Báo Bận (${session.busyList.length})`, value: busyText, inline: false });
  }

  CLASSES.forEach(c => {
    const list = session.members?.[c.id] || [];
    const text = list.length > 0 ? list.map((m, i) => `${i + 1}. <@${m.userId}> (${m.name})`).join('\n') : '*Chưa có ai*';
    embed.addFields({ name: `${getEmojiString(c.emoji)} ${c.name} (${list.length})`, value: text, inline: true });
  });

  embed.setFooter({ text: `Cập nhật lúc: ${new Date().toLocaleTimeString('vi-VN')}` });
  return embed;
}

function buildSummaryEmbed(session) {
  let total = 0;
  CLASSES.forEach(c => total += (session.members?.[c.id]?.length || 0));

  const embed = new EmbedBuilder()
    .setTitle(`📊 TỔNG KẾT ĐIỂM DANH: ${session.title}`)
    .setThumbnail(BANNER_IMAGE)
    .setColor('#00FF66')
    .setDescription(`🔒 **Phiên điểm danh đã chính thức khép lại!**\nThống kê tổng hợp số lượng đệ tử các môn phái tham gia:`)
    .addFields(
      { name: '👥 Tổng người tham gia', value: `**${total}** thành viên`, inline: true },
      { name: '⚠️ Tổng số báo bận', value: `**${session.busyList?.length || 0}** người`, inline: true }
    );

  let classSummaryText = CLASSES.map(c => {
    const count = session.members?.[c.id]?.length || 0;
    return `${getEmojiString(c.emoji)} **${c.name}**: \`${count}\` đệ tử`;
  }).join('\n');

  embed.addFields({ name: '⚔️ Phân chia lực lượng môn phái', value: classSummaryText, inline: false });

  if (session.busyList?.length > 0) {
    const busySummary = session.busyList.map((b, i) => `${i + 1}. <@${b.userId}> (${b.ingame}) - Lý do: *${b.reason}*`).join('\n');
    embed.addFields({ name: '📝 Danh sách báo bận chi tiết', value: busySummary, inline: false });
  }

  embed.setFooter({ text: `Hoàn tất tổng kết lúc: ${new Date().toLocaleTimeString('vi-VN')}` });
  return embed;
}

function buildComponents(isOpen = true) {
  const rows = [];
  let currentRow = new ActionRowBuilder();

  CLASSES.forEach((c, idx) => {
    if (idx > 0 && idx % 4 === 0) {
      if (rows.length < 3) {
        rows.push(currentRow);
        currentRow = new ActionRowBuilder();
      }
    }
    currentRow.addComponents(
      new ButtonBuilder()
        .setCustomId(`c_${c.id}`)
        .setLabel(c.name)
        .setEmoji(c.emoji || '⚔️')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(!isOpen)
    );
  });

  if (currentRow.components.length > 0 && rows.length < 3) rows.push(currentRow);

  rows.push(new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('a_cancel').setLabel('Hủy ĐK').setEmoji('❌').setStyle(ButtonStyle.Danger).setDisabled(!isOpen),
    new ButtonBuilder().setCustomId('a_busy').setLabel('Báo Bận').setEmoji('⏳').setStyle(ButtonStyle.Secondary).setDisabled(!isOpen),
    new ButtonBuilder().setCustomId('a_cancelbusy').setLabel('Hủy Bận').setEmoji('🗑️').setStyle(ButtonStyle.Secondary).setDisabled(!isOpen)
  ));

  rows.push(new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('a_admin').setLabel('Quản Lý').setEmoji('🛠️').setStyle(ButtonStyle.Primary)
  ));

  return rows;
}

client.on(Events.ClientReady, async () => {
  console.log(`🤖 Bot đã khởi động với tên: ${client.user.tag}`);
  const rest = new REST({ version: '10' }).setToken(TOKEN);

  const integrationTypes = [0, 1];
  const contexts = [0, 1, 2];

  try {
    await rest.put(Routes.applicationCommands(client.application.id), {
      body: [
        new SlashCommandBuilder()
          .setName('tao-phien')
          .setDescription('Tạo phiên điểm danh Bang chiến')
          .addStringOption(opt => opt.setName('ten').setDescription('Tên phiên điểm danh').setRequired(true))
          .addNumberOption(opt => opt.setName('gio').setDescription('Thời gian mở (giờ)').setRequired(false))
          .addChannelOption(opt => opt.setName('kenh').setDescription('Kênh gửi bảng').addChannelTypes(ChannelType.GuildText).setRequired(false)),

        new SlashCommandBuilder()
          .setName('check-gay')
          .setDescription('Kiểm tra tỷ lệ Gay của bản thân hoặc người khác')
          .addUserOption(opt => opt.setName('user').setDescription('Thành viên muốn kiểm tra').setRequired(false))
          .setIntegrationTypes(integrationTypes)
          .setContexts(contexts),

        new SlashCommandBuilder()
          .setName('check-les')
          .setDescription('Kiểm tra tỷ lệ Les của bản thân hoặc người khác')
          .addUserOption(opt => opt.setName('user').setDescription('Thành viên muốn kiểm tra').setRequired(false))
          .setIntegrationTypes(integrationTypes)
          .setContexts(contexts),

        new SlashCommandBuilder()
          .setName('check-beophi')
          .setDescription('Kiểm tra mức độ béo phì của bản thân hoặc người khác')
          .addUserOption(opt => opt.setName('user').setDescription('Thành viên muốn kiểm tra').setRequired(false))
          .setIntegrationTypes(integrationTypes)
          .setContexts(contexts),

        new SlashCommandBuilder()
          .setName('check-wibu')
          .setDescription('Kiểm tra mức độ Wibu của bản thân hoặc người khác')
          .addUserOption(opt => opt.setName('user').setDescription('Thành viên muốn kiểm tra').setRequired(false))
          .setIntegrationTypes(integrationTypes)
          .setContexts(contexts),

        new SlashCommandBuilder()
          .setName('check-haiten')
          .setDescription('Kiểm tra chỉ số nghiện HaiTen (Hentai) của bản thân hoặc người khác')
          .addUserOption(opt => opt.setName('user').setDescription('Thành viên muốn kiểm tra').setRequired(false))
          .setIntegrationTypes(integrationTypes)
          .setContexts(contexts),

        new SlashCommandBuilder()
          .setName('check-saygex')
          .setDescription('Kiểm tra chỉ số cuồng Say Gex (Đấu kiếm) của bản thân hoặc người khác')
          .addUserOption(opt => opt.setName('user').setDescription('Thành viên muốn kiểm tra').setRequired(false))
          .setIntegrationTypes(integrationTypes)
          .setContexts(contexts)
      ]
    });
    console.log('✅ Đã cập nhật xong hệ thống Slash Command!');
  } catch (e) {
    console.error('Lỗi đăng ký Slash Command:', e);
  }
});

client.on(Events.InteractionCreate, async (interaction) => {
  try {
    // 1. SLASH COMMANDS
    if (interaction.isChatInputCommand()) {
      const { commandName } = interaction;

      if (['check-gay', 'check-les', 'check-beophi', 'check-wibu', 'check-haiten', 'check-saygex'].includes(commandName)) {
        const target = interaction.options.getUser('user') || interaction.user;
        const typeKey = commandName.replace('check-', '');
        const percent = getPercentage(target.id, typeKey);

        const configs = {
          'check-gay': { title: '🌈 MÁY QUÉT GAY DETECTOR', emoji: '🏳️‍🌈', color: '#FF69B4' },
          'check-les': { title: '👩‍❤️‍👩 MÁY QUÉT LES DETECTOR', emoji: '👭', color: '#FF1493' },
          'check-beophi': { title: '🍔 MÁY QUÉT BÉO PHÌ', emoji: '🍔', color: '#FFA500' },
          'check-wibu': { title: '🍥 MÁY QUÉT ĐỘ WIBU', emoji: '🍥', color: '#9B59B6' },
          'check-haiten': { title: '🔞 MÁY QUÉT NGHIỆN HAITEN', emoji: '🔞', color: '#E74C3C' },
          'check-saygex': { title: '⚔️ MÁY QUÉT SAY GEX DETECTOR', emoji: '⚔️', color: '#8E44AD' }
        };

        const cfg = configs[commandName];
        const progressBar = createProgressBar(percent, cfg.emoji);
        const commentText = getCheckComment(typeKey, percent);

        const embed = new EmbedBuilder()
          .setTitle(cfg.title)
          .setThumbnail(target.displayAvatarURL({ dynamic: true }))
          .setImage(CHECK_IMAGES[typeKey])
          .setColor(cfg.color)
          .setDescription(`Kết quả phân tích của **${target.username}**:`)
          .addFields(
            { name: '📊 Chỉ số phân tích', value: `${progressBar}`, inline: false },
            { name: '💬 Đánh giá mặn mòi', value: `*${commentText}*`, inline: false }
          )
          .setFooter({ text: 'Kết quả mang tính chất giải trí bựa!' });

        return await interaction.reply({ embeds: [embed] });
      }

      if (commandName === 'tao-phien') {
        const title = interaction.options.getString('ten');
        const hours = interaction.options.getNumber('gio');
        const channel = interaction.options.getChannel('kenh') || interaction.channel;

        await interaction.reply({ content: `⏳ Đang tạo phiên điểm danh...`, ephemeral: true });

        const expiresAt = hours ? Date.now() + (hours * 3600 * 1000) : null;
        const session = {
          id: Date.now().toString(),
          creatorId: interaction.user.id,
          title,
          isOpen: true,
          expiresAt,
          members: {},
          busyList: []
        };
        CLASSES.forEach(c => session.members[c.id] = []);

        const sentMsg = await channel.send({
          embeds: [buildEmbed(session)],
          components: buildComponents(true)
        });

        session.messageId = sentMsg.id;
        activeSessions.set(sentMsg.id, session);

        await interaction.editReply({ content: `✅ Đã tạo bảng điểm danh thành công tại <#${channel.id}>!` });

        if (expiresAt) {
          setTimeout(async () => {
            if (session.isOpen) {
              session.isOpen = false;
              try {
                const msg = await channel.messages.fetch(sentMsg.id);
                if (msg) {
                  await msg.edit({ content: '⏰ **Phiên điểm danh đã tự động ĐÓNG!**', embeds: [buildEmbed(session)], components: buildComponents(false) });
                  await channel.send({ embeds: [buildSummaryEmbed(session)] });
                }
              } catch (err) {}
            }
          }, hours * 3600 * 1000);
        }
        return;
      }
    }

    // 2. PHÂN LOẠI BUTTON VÀ MODAL ĐIỂM DANH
    if (interaction.isButton() || interaction.isModalSubmit()) {
      const msgId = interaction.message?.id;
      let session = activeSessions.get(msgId);

      if (interaction.isButton() && interaction.customId === 'a_admin') {
        if (!session) return await interaction.reply({ content: '⚠️ Dữ liệu phiên không tồn tại trên bộ nhớ tạm!', ephemeral: true });

        // PHÂN QUYỀN CHẶT CHẼ
        const isOwner = session.creatorId === interaction.user.id;
        const isServerOwner = interaction.guild?.ownerId === interaction.user.id;
        const isAdmin = interaction.memberPermissions?.has(PermissionsBitField.Flags.Administrator);
        const hasManagerRole = interaction.member?.roles?.cache.some(r => 
          ['điều phối', 'quản lý', 'quản lí', 'dieu phoi', 'quan ly'].includes(r.name.toLowerCase())
        );

        if (!isOwner && !isServerOwner && !isAdmin && !hasManagerRole) {
          return await interaction.reply({ 
            content: '🚫 **Chỉ Chủ Server, Người Tạo Phiên, Điều Phối hoặc Quản Lý mới có thể mở menu này!**', 
            ephemeral: true 
          });
        }

        const adminRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId('adm_close').setLabel('Đóng Phiên').setEmoji('🛑').setStyle(ButtonStyle.Danger),
          new ButtonBuilder().setCustomId('adm_edit').setLabel('Đổi Tên').setEmoji('✏️').setStyle(ButtonStyle.Primary)
        );
        return await interaction.reply({ content: '🛠️ **Bảng điều khiển admin:**', components: [adminRow], ephemeral: true });
      }

      if (interaction.isButton() && interaction.customId === 'adm_close') {
        const parentMsg = interaction.message.reference?.messageId;
        const targetSession = activeSessions.get(parentMsg) || session;

        if (targetSession && targetSession.isOpen) {
          targetSession.isOpen = false;
          try {
            const msg = await interaction.channel.messages.fetch(targetSession.messageId);
            if (msg) {
              await msg.edit({ content: '🛑 **Phiên điểm danh đã được ĐÓNG bởi Quản Trị Viên!**', embeds: [buildEmbed(targetSession)], components: buildComponents(false) });
            }
            await interaction.channel.send({ embeds: [buildSummaryEmbed(targetSession)] });
          } catch (e) {}
        }
        return await interaction.reply({ content: '🛑 Đã đóng phiên và xuất bảng tổng kết!', ephemeral: true });
      }

      if (interaction.isButton() && interaction.customId === 'adm_edit') {
        const modal = new ModalBuilder()
          .setCustomId('modal_edit')
          .setTitle('Đổi tên phiên điểm danh')
          .addComponents(
            new ActionRowBuilder().addComponents(
              new TextInputBuilder().setCustomId('new_title').setLabel('Tên mới').setStyle(TextInputStyle.Short).setRequired(true)
            )
          );
        return await interaction.showModal(modal);
      }

      if (interaction.isModalSubmit() && interaction.customId === 'modal_edit') {
        await interaction.deferUpdate().catch(() => {});
        if (session) {
          session.title = interaction.fields.getTextInputValue('new_title');
          try {
            await interaction.message.edit({ embeds: [buildEmbed(session)] });
          } catch (e) {}
        }
        return await interaction.followUp({ content: '✅ Đã cập nhật tên phiên!', ephemeral: true });
      }

      if (session && !session.isOpen) {
        return await interaction.reply({ content: '🔴 Phiên điểm danh này đã kết thúc!', ephemeral: true });
      }

      if (interaction.isButton() && interaction.customId.startsWith('c_')) {
        const classId = interaction.customId.replace('c_', '');
        const modal = new ModalBuilder()
          .setCustomId(`m_join_${classId}`)
          .setTitle('Điểm Danh Môn Phái')
          .addComponents(
            new ActionRowBuilder().addComponents(
              new TextInputBuilder().setCustomId('ingame').setLabel('Tên nhân vật (In-game)').setStyle(TextInputStyle.Short).setRequired(true)
            )
          );
        return await interaction.showModal(modal);
      }

      if (interaction.isModalSubmit() && interaction.customId.startsWith('m_join_')) {
        await interaction.deferUpdate().catch(() => {});
        const classId = interaction.customId.replace('m_join_', '');
        if (!session || !session.isOpen) return await interaction.followUp({ content: '⚠️ Phiên đã đóng!', ephemeral: true });

        const ingame = interaction.fields.getTextInputValue('ingame');

        CLASSES.forEach(c => {
          if (session.members[c.id]) {
            session.members[c.id] = session.members[c.id].filter(m => m.userId !== interaction.user.id);
          }
        });
        session.busyList = session.busyList.filter(b => b.userId !== interaction.user.id);

        if (!session.members[classId]) session.members[classId] = [];
        session.members[classId].push({ userId: interaction.user.id, name: ingame });

        try {
          await interaction.message.edit({ embeds: [buildEmbed(session)] });
        } catch (e) {}
        return await interaction.followUp({ content: `✅ Đã ghi nhận điểm danh!`, ephemeral: true });
      }

      if (interaction.isButton() && interaction.customId === 'a_busy') {
        const modal = new ModalBuilder()
          .setCustomId('m_busy')
          .setTitle('Báo Bận Vắng Mặt')
          .addComponents(
            new ActionRowBuilder().addComponents(
              new TextInputBuilder().setCustomId('ingame').setLabel('Tên In-game').setStyle(TextInputStyle.Short).setRequired(true)
            ),
            new ActionRowBuilder().addComponents(
              new TextInputBuilder().setCustomId('reason').setLabel('Lý do bận').setStyle(TextInputStyle.Paragraph).setRequired(true)
            )
          );
        return await interaction.showModal(modal);
      }

      if (interaction.isModalSubmit() && interaction.customId === 'm_busy') {
        await interaction.deferUpdate().catch(() => {});
        if (!session || !session.isOpen) return await interaction.followUp({ content: '⚠️ Phiên đã đóng!', ephemeral: true });

        const ingame = interaction.fields.getTextInputValue('ingame');
        const reason = interaction.fields.getTextInputValue('reason');

        CLASSES.forEach(c => {
          if (session.members[c.id]) {
            session.members[c.id] = session.members[c.id].filter(m => m.userId !== interaction.user.id);
          }
        });
        session.busyList = session.busyList.filter(b => b.userId !== interaction.user.id);
        session.busyList.push({ userId: interaction.user.id, ingame, reason });

        try {
          await interaction.message.edit({ embeds: [buildEmbed(session)] });
        } catch (e) {}
        return await interaction.followUp({ content: `⌛ Đã ghi nhận báo bận!`, ephemeral: true });
      }

      if (interaction.isButton() && interaction.customId === 'a_cancelbusy') {
        await interaction.deferUpdate().catch(() => {});
        if (!session || !session.isOpen) return;
        session.busyList = session.busyList.filter(b => b.userId !== interaction.user.id);
        try {
          await interaction.message.edit({ embeds: [buildEmbed(session)] });
        } catch (e) {}
        return await interaction.followUp({ content: '🗑️ Đã xóa thông tin báo bận!', ephemeral: true });
      }

      if (interaction.isButton() && interaction.customId === 'a_cancel') {
        await interaction.deferUpdate().catch(() => {});
        if (!session || !session.isOpen) return;

        CLASSES.forEach(c => {
          if (session.members[c.id]) {
            session.members[c.id] = session.members[c.id].filter(m => m.userId !== interaction.user.id);
          }
        });
        session.busyList = session.busyList.filter(b => b.userId !== interaction.user.id);
        try {
          await interaction.message.edit({ embeds: [buildEmbed(session)] });
        } catch (e) {}
        return await interaction.followUp({ content: '❌ Đã hủy đăng ký điểm danh!', ephemeral: true });
      }
    }

  } catch (err) {
    console.error('Lỗi khi xử lý Interaction:', err);
  }
});

client.login(TOKEN);
