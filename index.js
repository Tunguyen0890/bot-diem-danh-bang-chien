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
  Events 
} = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

const CLASSES = [
  { id: 'culinh', name: 'Cửu Linh', emoji: '🔮' },
  { id: 'thantuong', name: 'Thần Tướng', emoji: '⚡' },
  { id: 'thiety', name: 'Thiết Y', emoji: '🛡️' },
  { id: 'toaimong', name: 'Toái Mộng', emoji: '🗡️' },
  { id: 'longngam', name: 'Long Ngâm', emoji: '🐉' },
  { id: 'tovan', name: 'Tố Vấn', emoji: '🌸' },
  { id: 'huyetha', name: 'Huyết Hà', emoji: '🩸' }
];

const sessions = new Map();

function buildEmbed(sessionData) {
  let total = 0;
  CLASSES.forEach(c => total += sessionData.members[c.id].length);

  const embed = new EmbedBuilder()
    .setTitle(`⚔️ ${sessionData.title}`)
    .setColor('#0099FF')
    .addFields(
      { name: 'Trạng thái', value: '🟢 Đang mở', inline: false },
      { name: 'Session ID', value: `\`${sessionData.id}\``, inline: false },
      { name: `Tổng cộng: ${total} người`, value: '\u200B', inline: false }
    );

  CLASSES.forEach(c => {
    const list = sessionData.members[c.id];
    const memberText = list.length > 0 ? list.map(m => `• ${m.name}`).join('\n') : '*Trống*';
    embed.addFields({
      name: `${c.emoji} ${c.name} (${list.length})`,
      value: memberText,
      inline: false
    });
  });

  const now = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  embed.setFooter({ text: `Cập nhật: Hôm nay lúc ${now}` });
  return embed;
}

function buildComponents() {
  const rows = [];
  let currentRow = new ActionRowBuilder();

  CLASSES.forEach((c, index) => {
    if (index > 0 && index % 3 === 0) {
      rows.push(currentRow);
      currentRow = new ActionRowBuilder();
    }
    currentRow.addComponents(
      new ButtonBuilder()
        .setCustomId(`btn_class_${c.id}`)
        .setLabel(c.name)
        .setEmoji(c.emoji)
        .setStyle(ButtonStyle.Secondary)
    );
  });
  rows.push(currentRow);

  const actionRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('btn_cancel').setLabel('Bỏ điểm danh').setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId('btn_busy').setLabel('Báo bận').setEmoji('⌛').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('btn_unbusy').setLabel('Hủy báo bận').setEmoji('✅').setStyle(ButtonStyle.Secondary)
  );
  rows.push(actionRow);

  return rows;
}

client.on(Events.MessageCreate, async (message) => {
  if (message.author.bot || !message.content.startsWith('!diemdanh')) return;

  const title = message.content.replace('!diemdanh', '').trim() || 'Tên sự kiện';
  const sessionId = Math.floor(10000000 + Math.random() * 90000000).toString();

  const initialData = { id: sessionId, title: title, members: {} };
  CLASSES.forEach(c => initialData.members[c.id] = []);

  const embed = buildEmbed(initialData);
  const components = buildComponents();

  const msg = await message.channel.send({ embeds: [embed], components });
  sessions.set(msg.id, initialData);
});

client.on(Events.InteractionCreate, async (interaction) => {
  const sessionData = sessions.get(interaction.message?.id);

  if (interaction.isButton() && interaction.customId.startsWith('btn_class_')) {
    if (!sessionData) return interaction.reply({ content: 'Phiên điểm danh này đã hết hạn!', ephemeral: true });

    const classId = interaction.customId.replace('btn_class_', '');
    const modal = new ModalBuilder()
      .setCustomId(`modal_${classId}_${interaction.message.id}`)
      .setTitle('Nhập tên In-Game');

    const nameInput = new TextInputBuilder()
      .setCustomId('ingame_input')
      .setLabel('Tên In-Game *')
      .setPlaceholder('VD: BonLang #1234')
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    modal.addComponents(new ActionRowBuilder().addComponents(nameInput));
    await interaction.showModal(modal);
  }

  if (interaction.isButton() && interaction.customId === 'btn_cancel') {
    if (!sessionData) return interaction.reply({ content: 'Phiên điểm danh không tồn tại!', ephemeral: true });

    CLASSES.forEach(c => {
      sessionData.members[c.id] = sessionData.members[c.id].filter(m => m.userId !== interaction.user.id);
    });

    await interaction.message.edit({ embeds: [buildEmbed(sessionData)] });
    await interaction.reply({ content: 'Đã hủy điểm danh của bạn!', ephemeral: true });
  }

  if (interaction.isModalSubmit() && interaction.customId.startsWith('modal_')) {
    const [, classId, messageId] = interaction.customId.split('_');
    const targetSession = sessions.get(messageId);
    if (!targetSession) return interaction.reply({ content: 'Không tìm thấy phiên điểm danh!', ephemeral: true });

    const ingameName = interaction.fields.getTextInputValue('ingame_input');

    CLASSES.forEach(c => {
      targetSession.members[c.id] = targetSession.members[c.id].filter(m => m.userId !== interaction.user.id);
    });

    targetSession.members[classId].push({ userId: interaction.user.id, name: ingameName });

    const channel = await client.channels.fetch(interaction.channelId);
    const targetMsg = await channel.messages.fetch(messageId);
    await targetMsg.edit({ embeds: [buildEmbed(targetSession)] });

    await interaction.reply({ content: `Đã ghi nhận báo danh **${ingameName}**!`, ephemeral: true });
  }
});

// Thay mã Token của bạn vào đây:
client.login('MTU0MDgxNjk3NzI2NDY0MDA2MQ.G1nyic.9MPYrLMC2-WE1bawv-F0xgmwMpMaRtrZDKEIvI');
