const planDetailService = require("../../services/shop/planDetail.service");

// Helper chung xử lý lỗi
const handleError = (res, error, defaultMsg) => {
  console.error(`Lỗi Controller:`, error);
  if (error.message.startsWith("NOT_FOUND")) {
    return res.status(404).json({ success: false, message: error.message.replace("NOT_FOUND: ", "") });
  }
  if (error.message.startsWith("BAD_REQUEST")) {
    return res.status(400).json({ success: false, message: error.message.replace("BAD_REQUEST: ", "") });
  }
  return res.status(500).json({ success: false, message: defaultMsg || "Đã xảy ra lỗi hệ thống." });
};

// ==========================================
// 1. CONTROLLER QUẢN LÝ KHÁCH HÀNG
// ==========================================

const addUsersToPlan = async (req, res) => {
  try {
    const shop_id = req.shop_user?.shop_id;
    const plan_id = req.params.planId; 
    const { user_ids } = req.body; 

    if (!shop_id) return res.status(400).json({ success: false, message: "Không lấy được shop_id từ Token." });

    const addedRecords = await planDetailService.addUsersToPlanService(shop_id, plan_id, user_ids);

    return res.status(201).json({
      success: true,
      message: `Đã thêm thành công ${addedRecords.length} khách hàng mới vào kế hoạch.`,
      data: addedRecords
    });
  } catch (error) {
    return handleError(res, error, "Lỗi khi thêm khách hàng vào kế hoạch.");
  }
};

const getUsersInPlan = async (req, res) => {
  try {
    const shop_id = req.shop_user?.shop_id;
    const plan_id = req.params.planId;

    if (!shop_id) return res.status(400).json({ success: false, message: "Không lấy được shop_id từ Token." });

    const users = await planDetailService.getUsersInPlanService(shop_id, plan_id);

    return res.status(200).json({
      success: true,
      message: "Lấy danh sách khách hàng trong kế hoạch thành công!",
      data: users
    });
  } catch (error) {
    return handleError(res, error, "Lỗi khi lấy danh sách khách hàng.");
  }
};

// ==========================================
// 2. CONTROLLER QUẢN LÝ SẢN PHẨM KHÁCH HÀNG
// ==========================================

const getShopProducts = async (req, res) => {
  try {
    const shop_id = req.shop_user?.shop_id;
    if (!shop_id) return res.status(400).json({ success: false, message: "Không lấy được shop_id từ Token." });

    const products = await planDetailService.getShopProducts(shop_id);
    return res.status(200).json({ success: true, data: products });
  } catch (error) {
    return handleError(res, error, "Lỗi lấy danh sách sản phẩm của shop");
  }
};

const assignProducts = async (req, res) => {
  try {
    const { plan_detail_id } = req.params;
    const { product_ids } = req.body; 

    const data = await planDetailService.assignProductsToCustomer(plan_detail_id, product_ids);
    
    return res.status(200).json({ 
      success: true, 
      message: "Thêm sản phẩm thành công", 
      data: data 
    });
  } catch (error) {
    return handleError(res, error, "Lỗi khi gán sản phẩm cho khách hàng");
  }
};

const getPlanDetailProducts = async (req, res) => {
  try {
    const { plan_detail_id } = req.params;
    const data = await planDetailService.getProductsOfPlanDetail(plan_detail_id);
    return res.status(200).json({ success: true, data: data });
  } catch (error) {
    return handleError(res, error, "Lỗi khi lấy sản phẩm của khách hàng");
  }
};


const updateMeasurementStatus = async (req, res) => {
  try {
    const { plan_detail_product_id } = req.params;
    const { is_measured } = req.body;

    const data = await planDetailService.updateProductMeasurementStatus(plan_detail_product_id, is_measured);
    
    return res.status(200).json({ 
      success: true, 
      message: "Cập nhật trạng thái đo thành công", 
      data: data 
    });
  } catch (error) {
    return handleError(res, error, "Lỗi khi cập nhật trạng thái đo");
  }
};

const removeProduct = async (req, res) => {
  try {
    const { plan_detail_product_id } = req.params;
    
    await planDetailService.removeProductFromCustomer(plan_detail_product_id);
    
    return res.status(200).json({ 
      success: true, 
      message: "Đã gỡ sản phẩm khỏi danh sách đo thành công" 
    });
  } catch (error) {
    return handleError(res, error, "Lỗi khi gỡ sản phẩm");
  }
};

module.exports = {
  addUsersToPlan,
  getUsersInPlan,
  getShopProducts,
  assignProducts,
  getPlanDetailProducts,
  updateMeasurementStatus,
  removeProduct
};