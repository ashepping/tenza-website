const orders = {};

const saveOrder = (userId, order) => {
  if (!orders[userId]) {
    orders[userId] = [];
  }
  orders[userId].push({
    ...order,
    timestamp: new Date().toISOString()
  });
};

const getUserOrders = (userId) => {
  return orders[userId] || [];
};

const clearUserOrder = (userId) => {
  delete orders[userId];
};

module.exports = {
  saveOrder,
  getUserOrders,
  clearUserOrder
};
