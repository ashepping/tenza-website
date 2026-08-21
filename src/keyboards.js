const products = require('./products');

const mainMenuKeyboard = {
  inline_keyboard: [
    [
      { text: '📦 Каталог товаров', callback_data: 'catalog' },
      { text: '📋 Мои бронирования', callback_data: 'bookings' }
    ],
    [
      { text: '📞 Контакты', callback_data: 'contacts' },
      { text: '❓ Помощь', callback_data: 'help' }
    ]
  ]
};

const categoriesKeyboard = {
  inline_keyboard: [
    [{ text: '🧥 Пиджаки', callback_data: 'category_Пиджаки' }],
    [{ text: '👔 Рубашки', callback_data: 'category_Рубашки' }],
    [{ text: '👖 Брюки', callback_data: 'category_Брюки' }],
    [{ text: '🎀 Галстуки', callback_data: 'category_Галстуки' }],
    [{ text: '👟 Обувь', callback_data: 'category_Обувь' }],
    [{ text: '👨 Готовый образ', callback_data: 'category_Готовый образ' }],
    [{ text: '🏠 Главное меню', callback_data: 'back_to_menu' }]
  ]
};

const getProductsKeyboard = (category) => {
  const categoryProducts = products.filter(p => p.category === category);
  const buttons = categoryProducts.map(p =>
    [{ text: p.name + ' ($' + p.price + ')', callback_data: 'product_' + p.id }]
  );
  buttons.push([{ text: '⬅️ Назад', callback_data: 'catalog' }, { text: '🏠 Меню', callback_data: 'back_to_menu' }]);
  return { inline_keyboard: buttons };
};

const sizeKeyboard = (product) => {
  const buttons = product.sizes.map(size =>
    ({ text: size, callback_data: 'size_' + size })
  );
  const chunks = [];
  for (let i = 0; i < buttons.length; i += 3) {
    chunks.push(buttons.slice(i, i + 3));
  }
  chunks.push([{ text: '⬅️ Назад', callback_data: 'back_to_products' }, { text: '🏠 Меню', callback_data: 'back_to_menu' }]);
  return { inline_keyboard: chunks };
};

const colorKeyboard = (product) => {
  const buttons = product.colors.map(color =>
    ({ text: color, callback_data: 'color_' + color })
  );
  const chunks = [];
  for (let i = 0; i < buttons.length; i += 2) {
    chunks.push(buttons.slice(i, i + 2));
  }
  chunks.push([{ text: '⬅️ Назад', callback_data: 'back_to_products' }, { text: '🏠 Меню', callback_data: 'back_to_menu' }]);
  return { inline_keyboard: chunks };
};

const deliveryKeyboard = {
  inline_keyboard: [
    [{ text: '🏪 Самовывоз', callback_data: 'delivery_pickup' }],
    [{ text: '🚚 Доставка по городу ($5)', callback_data: 'delivery_shipping' }],
    [{ text: '⬅️ Назад', callback_data: 'back_to_color' }, { text: '🏠 Меню', callback_data: 'back_to_menu' }]
  ]
};

const confirmKeyboard = {
  inline_keyboard: [
    [{ text: '✅ Подтвердить заказ', callback_data: 'confirm_order' }],
    [{ text: '❌ Отменить', callback_data: 'cancel_order' }],
    [{ text: '🏠 Главное меню', callback_data: 'back_to_menu' }]
  ]
};

const contactsKeyboard = {
  inline_keyboard: [
    [{ text: 'Телефон', callback_data: 'contact_phone' }],
    [{ text: 'Email', callback_data: 'contact_email' }],
    [{ text: 'Адрес', callback_data: 'contact_address' }],
    [{ text: 'Instagram', url: 'https://instagram.com/urban' }],
    [{ text: '🏠 Главное меню', callback_data: 'back_to_menu' }]
  ]
};

const helpKeyboard = {
  inline_keyboard: [
    [{ text: '🏠 Главное меню', callback_data: 'back_to_menu' }]
  ]
};

module.exports = {
  mainMenuKeyboard,
  categoriesKeyboard,
  getProductsKeyboard,
  sizeKeyboard,
  colorKeyboard,
  deliveryKeyboard,
  confirmKeyboard,
  contactsKeyboard,
  helpKeyboard
};
