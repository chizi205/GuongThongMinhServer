const orderRepo = require("../../repositories/admin/order.repo");

const getAllOrders = async (query) => {
  const { 
    page = 1, 
    limit = 10, 
    status, 
    payment_status, 
    startDate, 
    endDate, 
    keyword 
  } = query;
  
  const offset = (page - 1) * limit;

  // Gọi hàm getAllOrders từ Repo bạn vừa viết
  return await orderRepo.getAllOrders({
    status,
    payment_status,
    startDate,
    endDate,
    keyword,
    limit,
    offset
  });
};

const getRevenueStats = async () => {
  // Gọi hàm getRevenueStats từ Repo
  return await orderRepo.getRevenueStats();
};

const getOrderDetail = async (id) => {
  const order = await orderRepo.getOrderDetail(id);
  if (!order || !order.id) {
    const error = new Error("Hóa đơn không tồn tại");
    error.status = 404;
    throw error;
  }
  return order;
};

const updateOrder = async (id, data) => {
  // Gọi hàm updateOrder từ Repo
  return await orderRepo.updateOrder(id, data);
};

module.exports = {
  getAllOrders,
  getRevenueStats,
  getOrderDetail,
  updateOrder
};