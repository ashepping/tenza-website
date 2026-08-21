require('dotenv').config();
const { Telegraf } = require('telegraf');
const http = require('http');

console.log('Starting bot...');
console.log('BOT_TOKEN:', process.env.BOT_TOKEN ? 'SET' : 'MISSING');

const bot = new Telegraf(process.env.BOT_TOKEN);
const PORT = process.env.PORT || 3000;

// Simple HTTP server for Render port binding
http.createServer((req, res) => {
  res.end('OK');
}).listen(PORT, () => {
  console.log('HTTP server listening on port ' + PORT);
});

// Start command
bot.start(async (ctx) => {
  console.log('User /start:', ctx.from.id);
  await ctx.replyWithPhoto(
    'https://images.unsplash.com/photo-1506629082632-ffc1b02f5882?w=800',
    {
      caption: '🌟 Добро пожаловать в URBAN! 🌟\n\nМы продаём качественную мужскую одежду и аксессуары.'
    }
  );
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
