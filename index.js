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
  ChannelType,
  AttachmentBuilder
} = require('discord.js');
const admin = require('firebase-admin');

// ⚠️ LẤY TOKEN VÀ FIREBASE TỪ BIẾN MÔI TRƯỜNG (VARIABLES) TRÊN RAILWAY
const TOKEN = process.env.TOKEN;

const FIREBASE_DB_URL = process.env.FIREBASE_DB_URL;
const FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID;
const FIREBASE_CLIENT_EMAIL = process.env.FIREBASE_CLIENT_EMAIL;
const FIREBASE_PRIVATE_KEY = process.env.FIREBASE_PRIVATE_KEY ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') : null;

// Khởi tạo kết nối Firebase (Nếu có cấu hình)
if (FIREBASE_PROJECT_ID && FIREBASE_CLIENT_EMAIL && FIREBASE_PRIVATE_KEY) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: FIREBASE_PROJECT_ID,
        clientEmail: FIREBASE_CLIENT_EMAIL,
        privateKey: FIREBASE_PRIVATE_KEY
      }),
      databaseURL: FIREBASE_DB_URL
    });
    console.log('✅ Đã kết nối Firebase thành công!');
  } catch (e) {
    console.error('⚠️ Lỗi khởi tạo Firebase:', e.message);
  }
}

const db = admin.apps.length ? admin.database() : null;

async function syncToFirebase(guildId, session) {
  if (!db || !guildId) return;
  try {
    await db.ref(`guilds/${guildId}`).set(session);
    console.log(`✅ Đồng bộ phiên ${session.id} lên Firebase!`);
  } catch (err) {
    console.error('Lỗi sync Firebase:', err);
  }
}

const BANNER_IMAGE = 'https://i.giphy.com/media/v1.Y2lkPTc5MGI3NjExM3Z2eDFwZXRyNWJ1aGhybnMwbWN5OHAwMmdtbHJvMHFvMm5mMnF0dyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/L2XhHcmM55533fYnmA/giphy.gif';

const CLASSES = [
  { id: 'culinh', name: 'Cửu Linh', emoji: '1540995232848420926' },
  { id: 'thantuong', name: 'Thần Tướng', emoji: '1540995230877097984' },
  { id: 'thiety', name: 'Thiết Y', emoji: '1540995240691896431' },
  { id: 'toaimong', name: 'Toái Mộng', emoji: '1540995237084798986' },
  { id: 'longngam', name: 'Long Ngâm', emoji: '1540995228448723025' },
  { id: 'tovan', name: 'Tố Vấn', emoji: '1540995234840846437' },
  { id: 'huyetha', name: 'Huyết Hà', emoji: '1540995238909321327' }
];

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

const activeSessions = new Map();

process.on('unhandledRejection', (error) => console.error('Unhandled Rejection:', error));
process.on('uncaughtException', (error) => console.error('Uncaught Exception:', error));

function createJSONAttachment(session) {
  const jsonString = JSON.stringify(session, null, 2);
  return new AttachmentBuilder(Buffer.from(jsonString, 'utf-8'), {
    name: `vote_scrim_${session.id || Date.now()}.json`
  });
}

function getEmojiString(emoji) {
  if (!emoji) return '⚔️';
  return /^\d+$/.test(emoji) ? `<:custom:${emoji}>` : emoji;
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
    .setDescription(`🔒 **Phiên điểm danh đã chính thức khép lại!**`)
    .addFields(
      { name: '👥 Tổng người tham gia', value: `**${total}** thành viên`, inline: true },
      { name: '⚠️ Tổng số báo bận', value: `**${session.busyList?.length || 0}** người`, inline: true }
    );

  let classSummaryText = CLASSES.map(c => {
    const count = session.members?.[c.id]?.length || 0;
    return `${getEmojiString(c.emoji)} **${c.name}**: \`${count}\` đệ tử`;
  }).join('\n');

  embed.addFields({ name: '⚔️ Phân chia môn phái', value: classSummaryText, inline: false });

  if (session.busyList?.length > 0) {
    const busySummary = session.busyList.map((b, i) => `${i + 1}. <@${b.userId}> (${b.ingame}) - Lý do: *${b.reason}*`).join('\n');
    embed.addFields({ name: '📝 Danh sách báo bận', value: busySummary, inline: false });
  }

  embed.setFooter({ text: `Hoàn tất lúc: ${new Date().toLocaleTimeString('vi-VN')}` });
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
  console.log(`🤖 Bot đã chạy: ${client.user.tag}`);
  const rest = new REST({ version: '10' }).setToken(TOKEN);

  try {
    await rest.put(Routes.applicationCommands(client.application.id), {
      body: [
        new SlashCommandBuilder()
          .setName('tao-phien')
          .setDescription('Tạo phiên điểm danh Bang chiến')
          .addStringOption(opt => opt.setName('ten').setDescription('Tên phiên điểm danh').setRequired(true))
          .addNumberOption(opt => opt.setName('gio').setDescription('Thời gian mở (giờ)').setRequired(false))
          .addChannelOption(opt => opt.setName('kenh').setDescription('Kênh gửi bảng').addChannelTypes(ChannelType.GuildText).setRequired(false))
      ]
    });
    console.log('✅ Đã đăng ký lệnh /tao-phien!');
  } catch (e) {
    console.error('Lỗi Slash Command:', e);
  }
});

client.on(Events.InteractionCreate, async (interaction) => {
  try {
    if (interaction.isChatInputCommand() && interaction.commandName === 'tao-phien') {
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
      await syncToFirebase(interaction.guildId, session);

      await interaction.editReply({ content: `✅ Đã tạo bảng tại <#${channel.id}>!` });

      if (expiresAt) {
        setTimeout(async () => {
          if (session.isOpen) {
            session.isOpen = false;
            await syncToFirebase(interaction.guildId, session);
            try {
              const msg = await channel.messages.fetch(sentMsg.id);
              if (msg) {
                await msg.edit({ content: '⏰ **Phiên điểm danh đã ĐÓNG!**', embeds: [buildEmbed(session)], components: buildComponents(false) });
                await channel.send({ 
                  content: '📄 **Dữ liệu điểm danh JSON:**',
                  embeds: [buildSummaryEmbed(session)], 
                  files: [createJSONAttachment(session)] 
                });
              }
            } catch (err) {}
          }
        }, hours * 3600 * 1000);
      }
      return;
    }

    if (interaction.isButton() || interaction.isModalSubmit()) {
      const msgId = interaction.message?.id;
      let session = activeSessions.get(msgId);

      if (interaction.isButton() && interaction.customId === 'a_admin') {
        if (!session) return await interaction.reply({ content: '⚠️ Bộ nhớ tạm không tìm thấy phiên!', ephemeral: true });

        const isOwner = session.creatorId === interaction.user.id;
        const isServerOwner = interaction.guild?.ownerId === interaction.user.id;
        const isAdmin = interaction.memberPermissions?.has(PermissionsBitField.Flags.Administrator);

        if (!isOwner && !isServerOwner && !isAdmin) {
          return await interaction.reply({ content: '🚫 Chỉ Admin/Người tạo phiên mới dùng được!', ephemeral: true });
        }

        const adminRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId('adm_close').setLabel('Đóng Phiên').setEmoji('🛑').setStyle(ButtonStyle.Danger),
          new ButtonBuilder().setCustomId('adm_export_json').setLabel('Xuất JSON').setEmoji('📄').setStyle(ButtonStyle.Success)
        );
        return await interaction.reply({ content: '🛠️ **Menu Admin:**', components: [adminRow], ephemeral: true });
      }

      if (interaction.isButton() && interaction.customId === 'adm_export_json') {
        const parentMsg = interaction.message.reference?.messageId;
        const targetSession = activeSessions.get(parentMsg) || session;
        if (!targetSession) return await interaction.reply({ content: '⚠️ Dữ liệu không tồn tại!', ephemeral: true });

        return await interaction.reply({
          content: '📁 **Dữ liệu JSON:**',
          files: [createJSONAttachment(targetSession)],
          ephemeral: true
        });
      }

      if (interaction.isButton() && interaction.customId === 'adm_close') {
        const parentMsg = interaction.message.reference?.messageId;
        const targetSession = activeSessions.get(parentMsg) || session;

        if (targetSession && targetSession.isOpen) {
          targetSession.isOpen = false;
          await syncToFirebase(interaction.guildId, targetSession);
          try {
            const msg = await interaction.channel.messages.fetch(targetSession.messageId);
            if (msg) {
              await msg.edit({ content: '🛑 **Phiên điểm danh đã ĐÓNG!**', embeds: [buildEmbed(targetSession)], components: buildComponents(false) });
            }
            await interaction.channel.send({ 
              content: '📄 **Dữ liệu điểm danh JSON:**',
              embeds: [buildSummaryEmbed(targetSession)], 
              files: [createJSONAttachment(targetSession)] 
            });
          } catch (e) {}
        }
        return await interaction.reply({ content: '🛑 Đã đóng phiên thành công!', ephemeral: true });
      }

      if (session && !session.isOpen) return await interaction.reply({ content: '🔴 Phiên đã đóng!', ephemeral: true });

      if (interaction.isButton() && interaction.customId.startsWith('c_')) {
        const classId = interaction.customId.replace('c_', '');
        const modal = new ModalBuilder()
          .setCustomId(`m_join_${classId}`)
          .setTitle('Điểm Danh Môn Phái')
          .addComponents(new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('ingame').setLabel('Tên In-game').setStyle(TextInputStyle.Short).setRequired(true)));
        return await interaction.showModal(modal);
      }

      if (interaction.isModalSubmit() && interaction.customId.startsWith('m_join_')) {
        await interaction.deferUpdate().catch(() => {});
        const classId = interaction.customId.replace('m_join_', '');
        if (!session || !session.isOpen) return;

        const ingame = interaction.fields.getTextInputValue('ingame');

        CLASSES.forEach(c => {
          if (session.members[c.id]) session.members[c.id] = session.members[c.id].filter(m => m.userId !== interaction.user.id);
        });
        session.busyList = session.busyList.filter(b => b.userId !== interaction.user.id);

        if (!session.members[classId]) session.members[classId] = [];
        session.members[classId].push({ userId: interaction.user.id, name: ingame });

        await syncToFirebase(interaction.guildId, session);
        try { await interaction.message.edit({ embeds: [buildEmbed(session)] }); } catch (e) {}
        return await interaction.followUp({ content: `✅ Đã báo danh!`, ephemeral: true });
      }

      if (interaction.isButton() && interaction.customId === 'a_busy') {
        const modal = new ModalBuilder()
          .setCustomId('m_busy')
          .setTitle('Báo Bận Vắng Mặt')
          .addComponents(
            new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('ingame').setLabel('Tên In-game').setStyle(TextInputStyle.Short).setRequired(true)),
            new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('reason').setLabel('Lý do bận').setStyle(TextInputStyle.Paragraph).setRequired(true))
          );
        return await interaction.showModal(modal);
      }

      if (interaction.isModalSubmit() && interaction.customId === 'm_busy') {
        await interaction.deferUpdate().catch(() => {});
        if (!session || !session.isOpen) return;

        const ingame = interaction.fields.getTextInputValue('ingame');
        const reason = interaction.fields.getTextInputValue('reason');

        CLASSES.forEach(c => {
          if (session.members[c.id]) session.members[c.id] = session.members[c.id].filter(m => m.userId !== interaction.user.id);
        });
        session.busyList = session.busyList.filter(b => b.userId !== interaction.user.id);
        session.busyList.push({ userId: interaction.user.id, ingame, reason });

        await syncToFirebase(interaction.guildId, session);
        try { await interaction.message.edit({ embeds: [buildEmbed(session)] }); } catch (e) {}
        return await interaction.followUp({ content: `⌛ Đã ghi nhận báo bận!`, ephemeral: true });
      }

      if (interaction.isButton() && interaction.customId === 'a_cancelbusy') {
        await interaction.deferUpdate().catch(() => {});
        if (!session || !session.isOpen) return;
        session.busyList = session.busyList.filter(b => b.userId !== interaction.user.id);
        await syncToFirebase(interaction.guildId, session);
        try { await interaction.message.edit({ embeds: [buildEmbed(session)] }); } catch (e) {}
        return await interaction.followUp({ content: '🗑️️ Đã xóa báo bận!', ephemeral: true });
      }

      if (interaction.isButton() && interaction.customId === 'a_cancel') {
        await interaction.deferUpdate().catch(() => {});
        if (!session || !session.isOpen) return;

        CLASSES.forEach(c => {
          if (session.members[c.id]) session.members[c.id] = session.members[c.id].filter(m => m.userId !== interaction.user.id);
        });
        session.busyList = session.busyList.filter(b => b.userId !== interaction.user.id);
        await syncToFirebase(interaction.guildId, session);
        try { await interaction.message.edit({ embeds: [buildEmbed(session)] }); } catch (e) {}
        return await interaction.followUp({ content: '❌ Đã hủy đăng ký!', ephemeral: true });
      }
    }
  } catch (err) {
    console.error('Lỗi Interaction:', err);
  }
});

client.login(TOKEN);
