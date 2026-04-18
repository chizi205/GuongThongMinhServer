const planDetailRepo = require("../../repositories/admin/planDetail.repo");

const getShopProductsService = async (shop_id) => {
  if (!shop_id) throw new Error("BAD_REQUEST: Vui lòng cung cấp shop_id.");
  return await planDetailRepo.getProductsByShopId(shop_id);
};

const addUsersToPlanService = async (plan_id, user_ids) => {
  if (!plan_id || !user_ids || !Array.isArray(user_ids) || user_ids.length === 0) {
    throw new Error("BAD_REQUEST: Vui lòng cung cấp ID kế hoạch và danh sách ID khách hàng.");
  }
  const isExist = await planDetailRepo.checkPlanExists(plan_id);
  if (!isExist) throw new Error("NOT_FOUND: Kế hoạch không tồn tại.");
  
  return await planDetailRepo.addUsersToPlan(plan_id, user_ids);
};

const getUsersInPlanService = async (plan_id) => {
  if (!plan_id) throw new Error("BAD_REQUEST: Vui lòng cung cấp ID kế hoạch.");
  const isExist = await planDetailRepo.checkPlanExists(plan_id);
  if (!isExist) throw new Error("NOT_FOUND: Kế hoạch không tồn tại.");
  
  return await planDetailRepo.getUsersByPlanId(plan_id);
};

// THÊM MỚI: Logic xử lý lỗi khi gỡ khách hàng
const removeUserFromPlanService = async (plan_detail_id) => {
  if (!plan_detail_id) throw new Error("BAD_REQUEST: Thiếu ID chi tiết kế hoạch.");
  try {
    return await planDetailRepo.removeUserFromPlan(plan_detail_id);
  } catch (error) {
    if (error.message === "NOT_FOUND") {
      throw new Error("NOT_FOUND: Không tìm thấy khách hàng trong kế hoạch.");
    }
    throw error;
  }
};

const assignProductsToCustomerService = async (plan_detail_id, product_ids) => {
  if (!Array.isArray(product_ids) || product_ids.length === 0) {
    throw new Error("BAD_REQUEST: Vui lòng chọn ít nhất một sản phẩm.");
  }
  await planDetailRepo.addProductsToPlanDetail(plan_detail_id, product_ids);
  return await planDetailRepo.getProductsOfPlanDetail(plan_detail_id);
};

const getProductsOfPlanDetailService = async (plan_detail_id) => {
  return await planDetailRepo.getProductsOfPlanDetail(plan_detail_id);
};

const updateProductMeasurementStatusService = async (plan_detail_product_id, is_measured) => {
  if (typeof is_measured !== 'boolean') throw new Error("BAD_REQUEST: is_measured phải là boolean.");
  const updatedRecord = await planDetailRepo.updateProductMeasurementStatus(plan_detail_product_id, is_measured);
  if (!updatedRecord) throw new Error("NOT_FOUND: Không tìm thấy sản phẩm này trong kế hoạch.");
  return updatedRecord;
};

const removeProductFromCustomerService = async (plan_detail_product_id) => {
  if (!plan_detail_product_id) throw new Error("BAD_REQUEST: Thiếu ID sản phẩm cần gỡ.");
  const deletedRecord = await planDetailRepo.removeProductFromPlanDetail(plan_detail_product_id);
  if (!deletedRecord) throw new Error("NOT_FOUND: Không tìm thấy sản phẩm này trong kế hoạch.");
  return deletedRecord;
};

module.exports = {
  getShopProductsService, addUsersToPlanService, getUsersInPlanService, removeUserFromPlanService,
  assignProductsToCustomerService, getProductsOfPlanDetailService, 
  updateProductMeasurementStatusService, removeProductFromCustomerService
};