const planDetailService = require("../../services/admin/planDetail.service");

const getShopProducts = async (req, res, next) => {
  try {
    const { shop_id } = req.query;
    const products = await planDetailService.getShopProductsService(shop_id);
    res.status(200).json({ success: true, data: products });
  } catch (error) {
    next(error);
  }
};

const addUsersToPlan = async (req, res, next) => {
  try {
    const { planId } = req.params;
    const { user_ids } = req.body;
    const result = await planDetailService.addUsersToPlanService(planId, user_ids);
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const getUsersInPlan = async (req, res, next) => {
  try {
    const { planId } = req.params;
    const result = await planDetailService.getUsersInPlanService(planId);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

// THÊM MỚI: Hàm gỡ khách hàng
const removeUserFromPlan = async (req, res, next) => {
  try {
    const { id } = req.params; // ID của bảng plan_details
    const result = await planDetailService.removeUserFromPlanService(id);
    res.status(200).json({ success: true, message: "Đã gỡ khách hàng khỏi kế hoạch", data: result });
  } catch (error) {
    next(error);
  }
};

const getPlanDetailProducts = async (req, res, next) => {
  try {
    const { plan_detail_id } = req.params;
    const result = await planDetailService.getProductsOfPlanDetailService(plan_detail_id);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const assignProducts = async (req, res, next) => {
  try {
    const { plan_detail_id } = req.params;
    const { product_ids } = req.body;
    const result = await planDetailService.assignProductsToCustomerService(plan_detail_id, product_ids);
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const updateMeasurementStatus = async (req, res, next) => {
  try {
    const { plan_detail_product_id } = req.params;
    const { is_measured } = req.body;
    const result = await planDetailService.updateProductMeasurementStatusService(plan_detail_product_id, is_measured);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const removeProduct = async (req, res, next) => {
  try {
    const { plan_detail_product_id } = req.params;
    const result = await planDetailService.removeProductFromCustomerService(plan_detail_product_id);
    res.status(200).json({ success: true, message: "Gỡ sản phẩm thành công", data: result });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getShopProducts, addUsersToPlan, getUsersInPlan, removeUserFromPlan,
  getPlanDetailProducts, assignProducts, updateMeasurementStatus, removeProduct
};