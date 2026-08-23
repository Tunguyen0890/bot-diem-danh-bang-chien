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

// ⚠️ Thay Token Bot của bạn vào đây
const TOKEN = 'YOUR_BOT_TOKEN_HERE';

const BANNER_IMAGE = 'https://i.giphy.com/media/v1.Y2lkPTc5MGI3NjExM3Z2eDFwZXRyNWJ1aGhybnMwbWN5OHAwMmdtbHJvMHFvMm5mMnF0dyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/L2XhHcmM55533fYnmA/giphy.gif';

const CLASSES = [
  { id: 'culinh', name: 'Cửu Linh', emoji: '🔮' },
  { id: 'thantuong', name: 'Thần Tướng', emoji: '⚡' },
  { id: 'thiety', name: 'Thiết Y', emoji: '🛡️' },
  { id: 'toaimong', name: 'Toái Mộng', emoji: '🗡️' },
  { id: 'longngam', name: 'Long Ngâm', emoji: '🐉' },
  { id: 'tovan', name: 'Tố Vấn', emoji: '🌸' },
  { id: 'huyetha', name: 'Huyết Hà', emoji: '🩸' }
];

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
    embed.addFields({ name: `${c.emoji} ${c.name} (${list.length})`, value: text, inline: true });
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
    return `${c.emoji} **${c.name}**: \`${count}\` đệ tử`;
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
          .addUserOption(opt => opt.setName('user').setDescription('Thành viên muốn kiểm tra').setRequired(false)),

        new SlashCommandBuilder()
          .setName('check-les')
          .setDescription('Kiểm tra tỷ lệ Les của bản thân hoặc người khác')
          .addUserOption(opt => opt.setName('user').setDescription('Thành viên muốn kiểm tra').setRequired(false)),

        new SlashCommandBuilder()
          .setName('check-beophi')
          .setDescription('Kiểm tra mức độ béo phì của bản thân hoặc người khác')
          .addUserOption(opt => opt.setName('user').setDescription('Thành viên muốn kiểm tra').setRequired(false)),

        new SlashCommandBuilder()
          .setName('check-wibu')
          .setDescription('Kiểm tra mức độ Wibu của bản thân hoặc người khác')
          .addUserOption(opt => opt.setName('user').setDescription('Thành viên muốn kiểm tra').setRequired(false)),

        new SlashCommandBuilder()
          .setName('check-haiten')
          .setDescription('Kiểm tra chỉ số nghiện HaiTen (Hentai) của bản thân hoặc người khác')
          .addUserOption(opt => opt.setName('user').setDescription('Thành viên muốn kiểm tra').setRequired(false))
      ]
    });
    console.log('✅ Đã cập nhật xong hệ thống Slash Command');
  } catch (e) {
    console.error('Lỗi đăng ký Slash Command:', e);
  }
});

client.on(Events.InteractionCreate, async (interaction) => {
  try {
    // 1. SLASH COMMANDS
    if (interaction.isChatInputCommand()) {
      if (interaction.commandName === 'check-gay') {
        const target = interaction.options.getUser('user') || interaction.user;
        const percent = getPercentage(target.id, 'gay');
        const progressBar = createProgressBar(percent, '🏳️‍🌈');

        let statusText = '';
        if (percent === 0) statusText = 'Trai thẳng như cây thước 📏';
        else if (percent < 30) statusText = 'Có hơi chút "dẻo" nhẹ 🤫';
        else if (percent < 70) statusText = 'Tâm hồn nhạy cảm, nghi vấn rất cao! 🏳️‍🌈';
        else statusText = 'Gay chính hiệu 1000% không thể chối cãi! 👑💗';

        const embed = new EmbedBuilder()
          .setTitle(`🌈 BẢNG MÁY QUÉT GAY DETECTOR`)
          .setThumbnail(target.displayAvatarURL({ dynamic: true }))
          .setColor('#FF69B4')
          .setDescription(`Kết quả phân tích độ Gay của **${target.username}**:`)
          .addFields(
            { name: '📊 Chỉ số Gay', value: `${progressBar}`, inline: false },
            { name: '📝 Đánh giá', value: statusText, inline: false }
          )
          .setFooter({ text: 'Kết quả mang tính chất giải trí vui vẻ!' });

        return await interaction.reply({ embeds: [embed] });
      }

      if (interaction.commandName === 'check-les') {
        const target = interaction.options.getUser('user') || interaction.user;
        const percent = getPercentage(target.id, 'les');
        const progressBar = createProgressBar(percent, '👭');

        let statusText = '';
        if (percent === 0) statusText = 'Gái thẳng chuẩn chỉ 🌸';
        else if (percent < 30) statusText = 'Hơi thích ngắm gái đẹp tí thôi 🙈';
        else if (percent < 70) statusText = 'Mê con gái hơn mê con trai rồi nhé! 💃';
        else statusText = 'Nữ vương Bách Hợp, Les chuẩn chỉnh! 👭💖';

        const embed = new EmbedBuilder()
          .setTitle(`👩‍❤️‍👩 BẢNG MÁY QUÉT LES DETECTOR`)
          .setThumbnail(target.displayAvatarURL({ dynamic: true }))
          .setColor('#FF1493')
          .setDescription(`Kết quả phân tích độ Les của **${target.username}**:`)
          .addFields(
            { name: '📊 Chỉ số Les', value: `${progressBar}`, inline: false },
            { name: '📝 Đánh giá', value: statusText, inline: false }
          )
          .setFooter({ text: 'Kết quả mang tính chất giải trí vui vẻ!' });

        return await interaction.reply({ embeds: [embed] });
      }

      if (interaction.commandName === 'check-beophi') {
        const target = interaction.options.getUser('user') || interaction.user;
        const percent = getPercentage(target.id, 'beophi');
        const progressBar = createProgressBar(percent, '🍔');

        let statusText = '';
        if (percent === 0) statusText = 'Thân hình mình hạc xương mai, nhẹ như lông hồng 🏋️‍♂️';
        else if (percent < 30) statusText = 'Dáng chuẩn như siêu mẫu, mỡ thừa 0% 💪';
        else if (percent < 70) statusText = 'Béo mầm mạp đáng yêu, bắt đầu có nọng 🍩';
        else statusText = 'Thùng phi di động, bước đi làm rung chuyển Trái Đất! 🍔🍕🐘';

        const embed = new EmbedBuilder()
          .setTitle(`🍔 BẢNG MÁY QUÉT BÉO PHÌ`)
          .setThumbnail(target.displayAvatarURL({ dynamic: true }))
          .setColor('#FFA500')
          .setDescription(`Kết quả phân tích độ Béo Phì của **${target.username}**:`)
          .addFields(
            { name: '📊 Mức độ Béo Phì', value: `${progressBar}`, inline: false },
            { name: '📝 Đánh giá', value: statusText, inline: false }
          )
          .setFooter({ text: 'Kết quả mang tính chất giải trí vui vẻ!' });

        return await interaction.reply({ embeds: [embed] });
      }

      if (interaction.commandName === 'check-wibu') {
        const target = interaction.options.getUser('user') || interaction.user;
        const percent = getPercentage(target.id, 'wibu');
        const progressBar = createProgressBar(percent, '🍥');

        let statusText = '';
        if (percent === 0) statusText = 'Người bình thường, chưa bao giờ xem Anime 🚶‍♂️';
        else if (percent < 30) statusText = 'Wibu tập sự, mới biết xem Conan với Doraemon 🎒';
        else if (percent < 70) statusText = 'Wibu chính hiệu, suốt ngày Yamete Kudasai! ⛩️🌸';
        else statusText = 'Wibu chúa hạ sang! Sống cùng gối ôm Waifu 2D! 👑🍙🎎';

        const embed = new EmbedBuilder()
          .setTitle(`🍥 BẢNG MÁY QUÉT ĐỘ WIBU`)
          .setThumbnail(target.displayAvatarURL({ dynamic: true }))
          .setColor('#9B59B6')
          .setDescription(`Kết quả phân tích độ Wibu của **${target.username}**:`)
          .addFields(
            { name: '📊 Mức độ Wibu', value: `${progressBar}`, inline: false },
            { name: '📝 Đánh giá', value: statusText, inline: false }
          )
          .setFooter({ text: 'Kết quả mang tính chất giải trí vui vẻ!' });

        return await interaction.reply({ embeds: [embed] });
      }

      if (interaction.commandName === 'check-haiten') {
        const target = interaction.options.getUser('user') || interaction.user;
        const percent = getPercentage(target.id, 'haiten');
        const progressBar = createProgressBar(percent, '🔞');

        let statusText = '';
        if (percent === 0) statusText = 'Tâm hồn trong sáng như tờ giấy trắng 👼🏻';
        else if (percent < 30) statusText = 'Thỉnh thoảng có tò mò chút xíu 🙈';
        else if (percent < 70) statusText = 'Đầu óc đen tối, ng ngùng nhưng khoái xem 🌚';
        else statusText = 'Bậc thầy 6 chữ số, nguồn tài nguyên vô tận! 🦉🔞💥';

        const embed = new EmbedBuilder()
          .setTitle(`🔞 BẢNG MÁY QUÉT NGHIỆN HAITEN`)
          .setThumbnail(target.displayAvatarURL({ dynamic: true }))
          .setColor('#E74C3C')
          .setDescription(`Kết quả phân tích chỉ số nghiện HaiTen của **${target.username}**:`)
          .addFields(
            { name: '📊 Chỉ số Nghiện', value: `${progressBar}`, inline: false },
            { name: '📝 Đánh giá', value: statusText, inline: false }
          )
          .setFooter({ text: 'Kết quả mang tính chất giải trí vui vẻ!' });

        return await interaction.reply({ embeds: [embed] });
      }

      if (interaction.commandName === 'tao-phien') {
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
        const isOwner = session.creatorId === interaction.user.id;
        const isAdmin = interaction.memberPermissions?.has(PermissionsBitField.Flags.Administrator);
        if (!isOwner && !isAdmin) {
          return await interaction.reply({ content: '⚠️ Bạn không có quyền quản lý!', ephemeral: true });
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
