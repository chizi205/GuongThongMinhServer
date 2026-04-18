const measurementPlanRepo = require("../../repositories/shop/measurementPlan.repo");

const createPlanService = async (data) => {
  const { shop_id, name, note, status, created_by } = data;

  // 1. Validate dữ liệu
  if (!shop_id || !name) {
    // Ném lỗi để Controller bắt
    throw new Error("BAD_REQUEST: Vui lòng cung cấp đầy đủ thông tin bắt buộc: shop_id và name.");
  }

  // 2. Chuẩn bị payload để lưu
  const planPayload = {
    shop_id,
    name,
    note: note || null,
    status: status || 'pending',
    created_by: created_by || null
  };

  // 3. Gọi repository để lưu vào DB
  const newPlan = await measurementPlanRepo.createMeasurementPlan(planPayload);
  return newPlan;
};


const getPlansService = async (shop_id, searchKeyword) => {
  if (!shop_id) {
    throw new Error("BAD_REQUEST: Thiếu thông tin định danh Cửa hàng.");
  }
  const plans = await measurementPlanRepo.getPlansByShopId(shop_id, searchKeyword);
  return plans;
};

const updatePlanService = async (id, shop_id, data) => {
  if (!id || !shop_id) {
    throw new Error("BAD_REQUEST: Thiếu ID kế hoạch hoặc thông tin Cửa hàng.");
  }

  const updatedPlan = await measurementPlanRepo.updatePlan(id, shop_id, data);
  if (!updatedPlan) {
    throw new Error("NOT_FOUND: Không tìm thấy kế hoạch đo hoặc bạn không có quyền sửa.");
  }
  
  return updatedPlan;
};

const deletePlanService = async (id, shop_id) => {
  if (!id || !shop_id) {
    throw new Error("BAD_REQUEST: Thiếu ID kế hoạch hoặc thông tin Cửa hàng.");
  }

  const deletedPlan = await measurementPlanRepo.deletePlan(id, shop_id);
  if (!deletedPlan) {
    throw new Error("NOT_FOUND: Không tìm thấy kế hoạch đo hoặc đã bị xóa.");
  }
  
  return deletedPlan;
};

module.exports = {
  createPlanService,
  getPlansService,
  updatePlanService,
  deletePlanService
};
