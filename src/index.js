require('dotenv').config();
const { Telegraf } = require('telegraf');
const http = require('http');
const products = require('./products');

console.log('Starting bot...');
console.log('BOT_TOKEN:', process.env.BOT_TOKEN ? 'SET' : 'MISSING');

const bot = new Telegraf(process.env.BOT_TOKEN);
const PORT = process.env.PORT || 3000;

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
    [{ text: '🧥 Пиджаки', callback_data: 'category_Пиджаки' }],
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

// Bookings (empty for now)
bot.action('bookings', async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.editMessageText('📋 Мои бронирования\n\n(В разработке)', { reply_markup: { inline_keyboard: [[{ text: '🏠 Главное меню', callback_data: 'back_to_menu' }]] } });
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
  'Пиджаки': '🧥',
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
    reply_markup: { inline_keyboard: [[{ text: '⬅️ Назад', callback_data: 'catalog' }, { text: '🏠 Меню', callback_data: 'back_to_menu' }]] }
  });
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
