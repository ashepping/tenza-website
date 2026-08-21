require('dotenv').config();
const { Telegraf } = require('telegraf');
const products = require('./products');
const keyboards = require('./keyboards');
const config = require('./config');
const store = require('./store');

const bot = new Telegraf(process.env.BOT_TOKEN);

// Session middleware
const sessions = {};

const getSession = (userId) => {
  if (!sessions[userId]) {
    sessions[userId] = {};
  }
  return sessions[userId];
};

// Start command
bot.start(async (ctx) => {
  const userId = ctx.from.id;
  sessions[userId] = {};

  await ctx.replyWithPhoto(
    'https://images.unsplash.com/photo-1567521464027-f127ff144326?w=800',
    {
      caption: `🌟 Добро пожаловать в URBAN! 🌟\n\nМы продаём качественную мужскую одежду и аксессуары.\n\nВыбери что нужно:`,
      reply_markup: keyboards.mainMenuKeyboard
    }
  );
});

// Help command
bot.help((ctx) => {
  ctx.reply(
    `ℹ️ Справка по боту URBAN\n\n` +
    `📦 Каталог товаров - смотри всю коллекцию\n` +
    `📋 Мои бронирования - история твоих заказов\n` +
    `📞 Контакты - как найти нас\n\n` +
    `Напиши /start для возврата в главное меню`
  );
});

// Callback handlers
bot.action('catalog', async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.editMessageText(
    `📦 Выбери категорию товаров:`,
    { reply_markup: keyboards.categoriesKeyboard }
  );
});

bot.action('bookings', async (ctx) => {
  await ctx.answerCbQuery();
  const userId = ctx.from.id;
  const orders = store.getUserOrders(userId);

  if (orders.length === 0) {
    await ctx.editMessageText(
      `📋 У тебя пока нет заказов\n\nНачни с каталога товаров!`,
      { reply_markup: keyboards.mainMenuKeyboard }
    );
  } else {
    let text = `📋 Твои бронирования:\n\n`;
    orders.forEach((order, index) => {
      text += `${index + 1}. ${order.productName}\n` +
              `   Размер: ${order.size}, Цвет: ${order.color}\n` +
              `   Цена: $${order.price}\n` +
              `   Дата: ${new Date(order.timestamp).toLocaleString()}\n\n`;
    });
    await ctx.editMessageText(text, { reply_markup: keyboards.mainMenuKeyboard });
  }
});

bot.action('contacts', async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.editMessageText(
    `📞 Контакты URBAN:\n\n` +
    `📍 Адрес: ${config.storeInfo.address}\n` +
    `📞 Телефон: ${config.storeInfo.phone}\n` +
    `📧 Email: ${config.storeInfo.email}\n` +
    `📱 Instagram: ${config.storeInfo.instagram}\n\n` +
    `⏰ Время работы:\n${config.storeInfo.workingHours}`,
    { reply_markup: keyboards.contactsKeyboard }
  );
});

bot.action('help', async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.editMessageText(
    `ℹ️ Справка по боту\n\n` +
    `📦 Каталог - смотри товары\n` +
    `📋 Бронирования - твои заказы\n` +
    `📞 Контакты - как найти нас\n\n` +
    `Наш асортимент:\n` +
    `👕 Футболки - от $25\n` +
    `👔 Рубашки - от $32\n` +
    `🧥 Худи - от $45\n` +
    `👖 Джинсы - от $50\n` +
    `🧤 Куртки - от $85\n` +
    `👟 Обувь - от $65\n` +
    `⌚ Аксессуары - от $15`,
    { reply_markup: keyboards.mainMenuKeyboard }
  );
});

// Category handling
bot.action(/^category_(.+)$/, async (ctx) => {
  await ctx.answerCbQuery();
  const category = ctx.match[1];
  const session = getSession(ctx.from.id);
  session.category = category;

  const keyboard = keyboards.getProductsKeyboard(category);
  await ctx.editMessageText(
    `👕 Товары в категории "${category}":`,
    { reply_markup: keyboard }
  );
});

// Product handling
bot.action(/^product_(\d+)$/, async (ctx) => {
  await ctx.answerCbQuery();
  const productId = parseInt(ctx.match[1]);
  const product = products.find(p => p.id === productId);
  const session = getSession(ctx.from.id);
  session.product = product;

  let caption = `🖼 [${product.name}]\n\n` +
    `💰 Цена: $${product.price}\n` +
    `⭐ Рейтинг: ${product.rating}/5 (${product.reviewsCount} отзывов)\n` +
    `✅ В наличии\n\n` +
    `📋 ${product.description}\n\n` +
    `🧵 Материал: ${product.material}\n\n` +
    `🧼 Уход:\n` +
    product.care.map(c => `• ${c}`).join('\n') + '\n\n' +
    `📏 Доступные размеры: ${product.sizes.join(', ')}\n` +
    `🎨 Доступные цвета: ${product.colors.join(', ')}`;

  const keyboard = keyboards.sizeKeyboard(product);

  await ctx.editMessageCaption(caption, { reply_markup: keyboard });
});

// Size selection
bot.action(/^size_(.+)$/, async (ctx) => {
  await ctx.answerCbQuery();
  const size = ctx.match[1];
  const session = getSession(ctx.from.id);
  session.size = size;

  const keyboard = keyboards.colorKeyboard(session.product);
  await ctx.editMessageText(
    `🎨 Выбери цвет для размера ${size}:`,
    { reply_markup: keyboard }
  );
});

// Color selection
bot.action(/^color_(.+)$/, async (ctx) => {
  await ctx.answerCbQuery();
  const color = ctx.match[1];
  const session = getSession(ctx.from.id);
  session.color = color;

  await ctx.editMessageText(
    `📍 Способ получения:\n\n` +
    `🏪 Самовывоз - забери прямо из магазина\n` +
    `🚚 Доставка - +$5 к цене товара`,
    { reply_markup: keyboards.deliveryKeyboard }
  );
});

// Delivery selection
bot.action(/^delivery_(.+)$/, async (ctx) => {
  await ctx.answerCbQuery();
  const delivery = ctx.match[1];
  const session = getSession(ctx.from.id);
  session.delivery = delivery === 'pickup' ? 'Самовывоз' : 'Доставка по городу (+$5)';

  const msg = await ctx.editMessageText(
    `📞 Как тебя зовут?`,
    { reply_markup: { force_reply: true } }
  );
  session.awaitingName = true;
});

// Text input handler for name
bot.on('text', async (ctx) => {
  const session = getSession(ctx.from.id);

  if (session.awaitingName) {
    session.name = ctx.message.text;
    session.awaitingName = false;
    session.awaitingPhone = true;
    await ctx.reply(`Спасибо, ${session.name}! Твой номер телефона?`);
    return;
  }

  if (session.awaitingPhone) {
    session.phone = ctx.message.text;
    session.awaitingPhone = false;
    session.awaitingEmail = true;
    await ctx.reply(`Отлично! Теперь твой email?`);
    return;
  }

  if (session.awaitingEmail) {
    session.email = ctx.message.text;
    session.awaitingEmail = false;

    const totalPrice = session.product.price + (session.delivery.includes('Доставка') ? 5 : 0);

    const confirmText =
      `✅ Проверь информацию:\n\n` +
      `📦 Товар: ${session.product.name}\n` +
      `📏 Размер: ${session.size}\n` +
      `🎨 Цвет: ${session.color}\n` +
      `💰 Цена: $${totalPrice}\n` +
      `📍 Способ получения: ${session.delivery}\n\n` +
      `👤 ${session.name}\n` +
      `📞 ${session.phone}\n` +
      `📧 ${session.email}`;

    session.totalPrice = totalPrice;

    await ctx.reply(confirmText, { reply_markup: keyboards.confirmKeyboard });
  }
});

// Order confirmation
bot.action('confirm_order', async (ctx) => {
  await ctx.answerCbQuery();
  const session = getSession(ctx.from.id);
  const userId = ctx.from.id;

  const order = {
    productId: session.product.id,
    productName: session.product.name,
    price: session.product.price,
    size: session.size,
    color: session.color,
    delivery: session.delivery,
    name: session.name,
    phone: session.phone,
    email: session.email
  };

  store.saveOrder(userId, order);

  // User confirmation
  await ctx.editMessageText(
    `✅ Спасибо за заказ, ${session.name}!\n\n` +
    `📦 Товар: ${session.product.name}\n` +
    `📏 Размер: ${session.size}\n` +
    `🎨 Цвет: ${session.color}\n` +
    `💰 Итого: $${session.totalPrice}\n\n` +
    `⏱ Мы свяжемся с тобой в течение 1 часа!\n\n` +
    `Спасибо что выбрал URBAN! ❤️`,
    { reply_markup: keyboards.mainMenuKeyboard }
  );

  // Admin notification
  const adminMsg =
    `🔔 НОВЫЙ ЗАКАЗ!\n\n` +
    `📦 Товар: ${session.product.name}\n` +
    `📏 Размер: ${session.size}\n` +
    `🎨 Цвет: ${session.color}\n` +
    `💰 Сумма: $${session.totalPrice}\n` +
    `📍 Способ получения: ${session.delivery}\n\n` +
    `👤 ${session.name}\n` +
    `📞 ${session.phone}\n` +
    `📧 ${session.email}\n\n` +
    `⏰ ${new Date().toLocaleString()}`;

  try {
    await bot.telegram.sendMessage(config.adminChatId, adminMsg);
  } catch (err) {
    console.error('Failed to send admin notification:', err);
  }

  sessions[userId] = {};
});

// Order cancellation
bot.action('cancel_order', async (ctx) => {
  await ctx.answerCbQuery();
  const userId = ctx.from.id;
  sessions[userId] = {};

  await ctx.editMessageText(
    `❌ Заказ отменён\n\nВернись в главное меню:`,
    { reply_markup: keyboards.mainMenuKeyboard }
  );
});

// Back actions
bot.action('back_to_menu', async (ctx) => {
  await ctx.answerCbQuery();
  const userId = ctx.from.id;
  sessions[userId] = {};

  await ctx.editMessageText(
    `🌟 Добро пожаловать в URBAN! 🌟`,
    { reply_markup: keyboards.mainMenuKeyboard }
  );
});

bot.action('back_to_products', async (ctx) => {
  await ctx.answerCbQuery();
  const session = getSession(ctx.from.id);
  const keyboard = keyboards.getProductsKeyboard(session.category);

  await ctx.editMessageText(
    `👕 Товары в категории "${session.category}":`,
    { reply_markup: keyboard }
  );
});

bot.action('back_to_color', async (ctx) => {
  await ctx.answerCbQuery();
  const session = getSession(ctx.from.id);
  const keyboard = keyboards.sizeKeyboard(session.product);

  await ctx.editMessageText(
    `📏 Выбери размер:`,
    { reply_markup: keyboard }
  );
});

// Error handling
bot.catch((err, ctx) => {
  console.error('Bot error:', err);
});

// Launch
const PORT = process.env.PORT || 3000;
const http = require('http');

http.createServer((req, res) => {
  res.end('OK');
}).listen(PORT);

bot.launch({
  polling: {
    timeout: 30,
    limit: 100,
    allowedUpdates: ['message', 'callback_query']
  }
}).then(() => {
  console.log('🤖 URBAN Bot запущен!');
  console.log('Бот готов к работе 🚀');
}).catch((err) => {
  console.error('Failed to launch bot:', err);
  process.exit(1);
});

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
