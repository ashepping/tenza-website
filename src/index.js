require('dotenv').config();
const { Telegraf } = require('telegraf');
const http = require('http');
const products = require('./products');

console.log('Starting bot...');
console.log('BOT_TOKEN:', process.env.BOT_TOKEN ? 'SET' : 'MISSING');

const bot = new Telegraf(process.env.BOT_TOKEN);
const PORT = process.env.PORT || 3000;

// User bookings storage
const userBookings = {};
// User contact info storage
const userContacts = {};

// Main menu keyboard
const mainMenuKeyboard = {
  inline_keyboard: [
    [{ text: '📦 Каталог товаров', callback_data: 'catalog' }],
    [{ text: '📋 Мои бронирования', callback_data: 'bookings' }],
    [{ text: '📞 Контакты', callback_data: 'contacts' }],
    [{ text: '❓ Помощь', callback_data: 'help' }]
  ]
};

// Categories keyboard
const categoriesKeyboard = {
  inline_keyboard: [
    [{ text: '🤵 Пиджаки', callback_data: 'category_Пиджаки' }],
    [{ text: '👔 Рубашки', callback_data: 'category_Рубашки' }],
    [{ text: '👖 Брюки', callback_data: 'category_Брюки' }],
    [{ text: '🎀 Галстуки', callback_data: 'category_Галстуки' }],
    [{ text: '👟 Обувь', callback_data: 'category_Обувь' }],
    [{ text: '👨 Готовый образ', callback_data: 'category_Готовый образ' }],
    [{ text: '⬅️ Назад', callback_data: 'back_to_menu' }]
  ]
};

// Simple HTTP server for Render port binding
http.createServer((req, res) => {
  res.end('OK');
}).listen(PORT, () => {
  console.log('HTTP server listening on port ' + PORT);
});

// Start command
bot.start(async (ctx) => {
  console.log('User /start:', ctx.from.id);
  await ctx.reply('🌟 Добро пожаловать в URBAN! 🌟\n\nМы продаём качественную мужскую одежду и аксессуары.\n\nВыбери что нужно:', { reply_markup: mainMenuKeyboard });
});

// Catalog
bot.action('catalog', async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.editMessageText('📦 Выбери категорию товаров:', { reply_markup: categoriesKeyboard });
});

// Back to menu
bot.action('back_to_menu', async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.editMessageText('🌟 Добро пожаловать в URBAN! 🌟\n\nМы продаём качественную мужскую одежду и аксессуары.\n\nВыбери что нужно:', { reply_markup: mainMenuKeyboard });
});

// Bookings
bot.action('bookings', async (ctx) => {
  await ctx.answerCbQuery();
  const userId = ctx.from.id;
  const userBookingsList = userBookings[userId] || [];

  if (userBookingsList.length === 0) {
    await ctx.editMessageText('📋 Мои бронирования\n\nУ вас нет добавленных товаров', { reply_markup: { inline_keyboard: [[{ text: '🏠 Главное меню', callback_data: 'back_to_menu' }]] } });
    return;
  }

  let bookingText = '📋 Мои бронирования\n\n';
  let totalPrice = 0;

  userBookingsList.forEach((booking, index) => {
    bookingText += `${index + 1}. ${booking.productName} - $${booking.price}\n`;
    totalPrice += booking.price;
  });

  bookingText += `\n💰 Всего: $${totalPrice}`;

  const buttons = userBookingsList.map((booking, index) =>
    [{ text: `❌ Удалить ${booking.productName}`, callback_data: 'delete_booking_' + index }]
  );
  buttons.push([{ text: '✅ Подтвердить бронирование', callback_data: 'confirm_booking' }]);
  buttons.push([{ text: '🏠 Главное меню', callback_data: 'back_to_menu' }]);

  userContacts[userId] = { bookings: [...userBookingsList], total: totalPrice };

  await ctx.editMessageText(bookingText, { reply_markup: { inline_keyboard: buttons } });
});

// Contacts (empty for now)
bot.action('contacts', async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.editMessageText('📞 Контакты\n\n(В разработке)', { reply_markup: { inline_keyboard: [[{ text: '🏠 Главное меню', callback_data: 'back_to_menu' }]] } });
});

// Help (empty for now)
bot.action('help', async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.editMessageText('❓ Помощь\n\n(В разработке)', { reply_markup: { inline_keyboard: [[{ text: '🏠 Главное меню', callback_data: 'back_to_menu' }]] } });
});

// Category icons
const categoryIcons = {
  'Пиджаки': '🤵',
  'Рубашки': '👔',
  'Брюки': '👖',
  'Галстуки': '🎀',
  'Обувь': '👞',
  'Готовый образ': '🤵'
};

// Category selection
bot.action(/^category_(.+)$/, async (ctx) => {
  await ctx.answerCbQuery();
  const category = ctx.match[1];
  const categoryProducts = products.filter(p => p.category === category);
  const icon = categoryIcons[category] || '📦';

  const buttons = categoryProducts.map(p => [{ text: p.name, callback_data: 'product_' + p.id }]);
  buttons.push([{ text: '⬅️ Назад', callback_data: 'catalog' }, { text: '🏠 Меню', callback_data: 'back_to_menu' }]);

  await ctx.editMessageText(`${icon} Товары категории "${category}":`, {
    reply_markup: { inline_keyboard: buttons }
  });
});

// Product selection
bot.action(/^product_(\d+)$/, async (ctx) => {
  await ctx.answerCbQuery();
  const productId = parseInt(ctx.match[1]);
  const product = products.find(p => p.id === productId);
  const icon = categoryIcons[product.category] || '📦';

  await ctx.editMessageText(`${icon} ${product.name}\n\nЦена: $${product.price || 'TBD'}\n\nЭто пустая карточка товара`, {
    reply_markup: { inline_keyboard: [[{ text: '➕ Добавить в бронирования', callback_data: 'add_booking_' + productId }], [{ text: '⬅️ Назад', callback_data: 'catalog' }, { text: '🏠 Меню', callback_data: 'back_to_menu' }]] }
  });
});

// Add to bookings
bot.action(/^add_booking_(\d+)$/, async (ctx) => {
  await ctx.answerCbQuery();
  const productId = parseInt(ctx.match[1]);
  const product = products.find(p => p.id === productId);
  const userId = ctx.from.id;

  if (!userBookings[userId]) {
    userBookings[userId] = [];
  }

  userBookings[userId].push({
    productId: product.id,
    productName: product.name,
    price: product.price,
    category: product.category
  });

  await ctx.answerCbQuery('✅ Товар добавлен в бронирования', { show_alert: true });
});

// Delete booking item
bot.action(/^delete_booking_(\d+)$/, async (ctx) => {
  await ctx.answerCbQuery();
  const userId = ctx.from.id;
  const index = parseInt(ctx.match[1]);

  if (userBookings[userId] && userBookings[userId][index]) {
    const removed = userBookings[userId].splice(index, 1);
    await ctx.answerCbQuery(`❌ ${removed[0].productName} удален из бронирований`, { show_alert: true });

    if (userBookings[userId].length === 0) {
      await ctx.editMessageText('📋 Мои бронирования\n\nУ вас нет добавленных товаров', { reply_markup: { inline_keyboard: [[{ text: '🏠 Главное меню', callback_data: 'back_to_menu' }]] } });
    } else {
      let bookingText = '📋 Мои бронирования\n\n';
      let totalPrice = 0;

      userBookings[userId].forEach((booking, idx) => {
        bookingText += `${idx + 1}. ${booking.productName} - $${booking.price}\n`;
        totalPrice += booking.price;
      });

      bookingText += `\n💰 Всего: $${totalPrice}`;

      const buttons = userBookings[userId].map((booking, idx) =>
        [{ text: `❌ Удалить ${booking.productName}`, callback_data: 'delete_booking_' + idx }]
      );
      buttons.push([{ text: '✅ Подтвердить бронирование', callback_data: 'confirm_booking' }]);
      buttons.push([{ text: '🏠 Главное меню', callback_data: 'back_to_menu' }]);

      await ctx.editMessageText(bookingText, { reply_markup: { inline_keyboard: buttons } });
    }
  }
});

// Confirm booking
bot.action('confirm_booking', async (ctx) => {
  await ctx.answerCbQuery();
  const userId = ctx.from.id;
  const userBookingsList = userBookings[userId] || [];

  if (userBookingsList.length === 0) {
    await ctx.answerCbQuery('❌ Нечего подтверждать', { show_alert: true });
    return;
  }

  let bookingText = '✅ Заказ получен!\n\n';
  let totalPrice = 0;

  userBookingsList.forEach((booking, index) => {
    bookingText += `${index + 1}. ${booking.productName} - $${booking.price}\n`;
    totalPrice += booking.price;
  });

  bookingText += `\n💰 Всего: $${totalPrice}`;

  userContacts[userId] = { bookings: [...userBookingsList], total: totalPrice };

  await ctx.editMessageText(bookingText, {
    reply_markup: { inline_keyboard: [[{ text: '📝 Подтвердить контакты', callback_data: 'enter_contact_info' }]] }
  });
});

// Enter contact info - start contact branch
bot.action('enter_contact_info', async (ctx) => {
  await ctx.answerCbQuery();
  const userId = ctx.from.id;
  ctx.session = ctx.session || {};
  ctx.session.awaitingName = userId;

  await ctx.editMessageText(
    '📝 Подтвердить контакты\n\n👤 Введите ваше имя:',
    { reply_markup: { remove_keyboard: true } }
  );
});

// Handle text input for name and phone
bot.on('text', async (ctx) => {
  const userId = ctx.from.id;
  ctx.session = ctx.session || {};

  // Step 1: Capture name
  if (ctx.session.awaitingName === userId) {
    userContacts[userId].name = ctx.message.text;
    ctx.session.awaitingName = null;
    ctx.session.awaitingPhone = userId;

    await ctx.reply('✅ Имя сохранено!\n\n📱 Введите ваш номер телефона:');
    return;
  }

  // Step 2: Capture phone and show confirmation
  if (ctx.session.awaitingPhone === userId) {
    userContacts[userId].phone = ctx.message.text;
    ctx.session.awaitingPhone = null;

    let confirmText = '📝 Проверьте ваши контакты:\n\n';
    confirmText += `👤 Имя: ${userContacts[userId].name}\n`;
    confirmText += `📱 Телефон: ${userContacts[userId].phone}`;

    await ctx.reply(confirmText, {
      reply_markup: {
        inline_keyboard: [
          [{ text: '✅ Подтвердить', callback_data: 'confirm_contacts' }],
          [{ text: '❌ Отмена', callback_data: 'cancel_contacts' }]
        ]
      }
    });
    return;
  }
});

// Confirm contacts - final step
bot.action('confirm_contacts', async (ctx) => {
  await ctx.answerCbQuery();
  const userId = ctx.from.id;
  const contacts = userContacts[userId];

  let finalText = '✅ Спасибо за заказ!\n\n';
  finalText += '📋 Ваш заказ:\n';
  contacts.bookings.forEach((booking, index) => {
    finalText += `${index + 1}. ${booking.productName} - $${booking.price}\n`;
  });
  finalText += `\n💰 Всего: $${contacts.total}`;
  finalText += `\n👤 Имя: ${contacts.name}`;
  finalText += `\n📱 Телефон: ${contacts.phone}`;
  finalText += '\n\n✨ Мы скоро свяжемся с вами!';

  userBookings[userId] = [];
  userContacts[userId] = {};

  await ctx.reply(finalText, { reply_markup: mainMenuKeyboard });
});

// Cancel contacts
bot.action('cancel_contacts', async (ctx) => {
  await ctx.answerCbQuery();
  const userId = ctx.from.id;
  ctx.session = ctx.session || {};
  ctx.session.awaitingName = null;
  ctx.session.awaitingPhone = null;

  await ctx.reply('❌ Отмена. Возвращаемся в меню.', { reply_markup: mainMenuKeyboard });
});

// Launch
bot.launch({
  polling: {
    timeout: 30,
    limit: 100,
    allowedUpdates: ['message', 'callback_query']
  }
}).then(() => {
  console.log('✅ Bot started successfully');
}).catch((err) => {
  console.error('❌ Bot error:', err.message);
  process.exit(1);
});

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
