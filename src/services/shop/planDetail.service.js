const planDetailRepo = require("../../repositories/shop/planDetail.repo");

// ==========================================
// 1. CÁC HÀM QUẢN LÝ KHÁCH HÀNG TRONG KẾ HOẠCH
// ==========================================

const addUsersToPlanService = async (shop_id, plan_id, user_ids) => {
  if (!plan_id || !user_ids || !Array.isArray(user_ids) || user_ids.length === 0) {
    throw new Error("BAD_REQUEST: Vui lòng cung cấp ID kế hoạch và danh sách ID khách hàng (dạng mảng).");
  }

  const isOwner = await planDetailRepo.checkPlanOwnership(plan_id, shop_id);
  if (!isOwner) {
    throw new Error("NOT_FOUND: Kế hoạch không tồn tại hoặc bạn không có quyền truy cập.");
  }

  const addedRecords = await planDetailRepo.addUsersToPlan(plan_id, user_ids);
  return addedRecords;
};

const getUsersInPlanService = async (shop_id, plan_id) => {
  if (!plan_id) {
    throw new Error("BAD_REQUEST: Vui lòng cung cấp ID kế hoạch.");
  }

  const isOwner = await planDetailRepo.checkPlanOwnership(plan_id, shop_id);
  if (!isOwner) {
    throw new Error("NOT_FOUND: Kế hoạch không tồn tại hoặc bạn không có quyền truy cập.");
  }

  const users = await planDetailRepo.getUsersByPlanId(plan_id);
  return users;
};

// ==========================================
// 2. CÁC HÀM QUẢN LÝ SẢN PHẨM CỦA KHÁCH HÀNG
// ==========================================

const getShopProducts = async (shop_id) => {
  return await planDetailRepo.getProductsByShopId(shop_id);
};

const assignProductsToCustomer = async (plan_detail_id, product_ids) => {
  if (!Array.isArray(product_ids) || product_ids.length === 0) {
    throw new Error("BAD_REQUEST: Vui lòng chọn ít nhất một sản phẩm.");
  }
  
  await planDetailRepo.addProductsToPlanDetail(plan_detail_id, product_ids);
  return await planDetailRepo.getProductsOfPlanDetail(plan_detail_id);
};

const getProductsOfPlanDetail = async (plan_detail_id) => {
  return await planDetailRepo.getProductsOfPlanDetail(plan_detail_id);
};

const updateProductMeasurementStatus = async (plan_detail_product_id, is_measured) => {
  if (typeof is_measured !== 'boolean') {
    throw new Error("BAD_REQUEST: Trạng thái is_measured phải là true hoặc false.");
  }
  
  const updatedRecord = await planDetailRepo.updateProductMeasurementStatus(plan_detail_product_id, is_measured);
  if (!updatedRecord) {
    throw new Error("NOT_FOUND: Không tìm thấy sản phẩm này trong kế hoạch.");
  }
  return updatedRecord;
};


const removeProductFromCustomer = async (plan_detail_product_id) => {
  if (!plan_detail_product_id) {
    throw new Error("BAD_REQUEST: Thiếu ID sản phẩm cần gỡ.");
  }

  const deletedRecord = await planDetailRepo.removeProductFromPlanDetail(plan_detail_product_id);
  
  if (!deletedRecord) {
    throw new Error("NOT_FOUND: Không tìm thấy sản phẩm này trong kế hoạch.");
  }
  
  return deletedRecord;
};
module.exports = {
  addUsersToPlanService,
  getUsersInPlanService,
  getShopProducts,
  assignProductsToCustomer,
  getProductsOfPlanDetail,
  updateProductMeasurementStatus,
  removeProductFromCustomer
};