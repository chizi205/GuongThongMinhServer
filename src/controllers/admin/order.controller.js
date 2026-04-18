const orderService = require("../../services/admin/order.service");
const { ok, badRequest, serverError } = require("../../utils/response");

const getOrders = async (req, res) => {
  try {
    // req.query lúc này sẽ bao gồm: { shop_id, status, keyword, startDate, endDate, ... }
    const data = await orderService.getAllOrders(req.query);
    return ok(res, 200, { data });
  } catch (err) {
    return serverError(res, err.message);
  }
};

const getStats = async (req, res) => {
  try {
    // SỬA TẠI ĐÂY: Lấy shop_id từ query để thống kê doanh thu riêng cho từng shop
    const { shop_id } = req.query;
    const data = await orderService.getRevenueStats(shop_id);
    return ok(res, 200, { data });
  } catch (err) {
    return serverError(res, err.message);
  }
};

const getOrderDetail = async (req, res) => {
  try {
    const data = await orderService.getOrderDetail(req.params.id);
    return ok(res, 200, { data });
  } catch (err) {
    if (err.status === 404) return badRequest(res, err.message);
    return serverError(res, err.message);
  }
};

const updateOrder = async (req, res) => {
  try {
    const data = await orderService.updateOrder(req.params.id, req.body);
    return ok(res, 200, { data, message: "Cập nhật hóa đơn thành công" });
  } catch (err) {
    return serverError(res, err.message);
  }
};

module.exports = {
  getOrders,
  getStats,
  getOrderDetail,
  updateOrder
};