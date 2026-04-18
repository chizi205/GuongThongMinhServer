const repo = require("../../repositories/measurementPlan/planDetail.repo");

const getCustomers = async ({ plan_id, staff }) => {
  if (!staff || !staff.shop_id) {
    const err = new Error("UNAUTHORIZED");
    err.status = 401;
    throw err;
  }

  if (!plan_id) {
    const err = new Error("MISSING_PLAN_ID");
    err.status = 400;
    throw err;
  }

  const customers = await repo.getCustomersByPlan({ plan_id });

  return customers;
};

const getUserMeasurementProducts = async (plan_detail_id) => {
  if (!plan_detail_id) {
    throw new Error("BAD_REQUEST: Thiếu ID chi tiết kế hoạch của khách hàng.");
  }
  
  const products = await repo.getProductsByPlanDetailId(plan_detail_id);
  return products;
};

const getProductMeasurementParams = async (product_id) => {
  if (!product_id) {
    throw new Error("BAD_REQUEST: Thiếu ID sản phẩm.");
  }
  
  const params = await repo.getMeasurementParamsByProductId(product_id);
  return params;
};

const saveProductMeasurements = async (plan_detail_id, product_id, measurements) => {
  if (!plan_detail_id) {
    throw new Error("BAD_REQUEST: Thiếu plan_detail_id.");
  }
  if (!product_id) {
    throw new Error("BAD_REQUEST: Thiếu product_id. Cần ID sản phẩm để chốt trạng thái đo.");
  }
  if (!measurements || !Array.isArray(measurements) || measurements.length === 0) {
    throw new Error("BAD_REQUEST: Danh sách số đo không hợp lệ.");
  }

  const savedResults = [];
  
  // 1. Lưu từng thông số vào database
  for (const item of measurements) {
    const { param_id, value } = item;
    if (param_id && value !== undefined) {
      const saved = await repo.saveMeasurementValue(plan_detail_id, param_id, value);
      savedResults.push(saved);
    }
  }

  // 2. Chuyển trạng thái áo thành "Đã đo"
  await repo.markProductAsMeasured(plan_detail_id, product_id);

  // 3. Kiểm tra xem khách hàng này đã đo xong hết đồ chưa
  const customerFinished = await repo.checkAndUpdateCustomerStatus(plan_detail_id);
  
  // 4. Nếu khách hàng xong, kiểm tra xem cả Kế hoạch đó đã xong hết mọi người chưa
  if (customerFinished && customerFinished.plan_id) {
    await repo.checkAndUpdatePlanStatus(customerFinished.plan_id);
  }

  return savedResults;
};

module.exports = {
  getCustomers,
  getUserMeasurementProducts,
  getProductMeasurementParams,
  saveProductMeasurements
};