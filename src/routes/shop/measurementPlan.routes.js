const express = require("express");
const router = express.Router();
const measurementPlanController = require("../../controllers/shop/measurementPlan.controller");
const authController = require("../../middleware/authShop");
const planDetailController = require("../../controllers/shop/planDetail.controller");

// Bắt buộc xác thực cho toàn bộ route bên dưới
router.use(authController);

// ==========================================
// 1. API TIỆN ÍCH (LOOKUP)
// ==========================================
// Lấy danh sách sản phẩm của shop (Phải để trên cùng để tránh trùng params)
router.get("/shop-products", planDetailController.getShopProducts);

// ==========================================
// 2. KẾ HOẠCH ĐO (MEASUREMENT PLANS)
// Endpoint gốc: /api/.../measurement-plans
// ==========================================
router.post("/", measurementPlanController.createPlan);
router.get("/", measurementPlanController.getPlans);
router.put("/:id", measurementPlanController.updatePlan);
router.delete("/:id", measurementPlanController.deletePlan);

// ==========================================
// 3. KHÁCH HÀNG TRONG KẾ HOẠCH (PLAN DETAILS)
// Endpoint: /:planId/users
// ==========================================
router.get("/:planId/users", planDetailController.getUsersInPlan);
router.post("/:planId/users", planDetailController.addUsersToPlan);

// ==========================================
// 4. SẢN PHẨM CỦA 1 KHÁCH HÀNG (PRODUCTS IN PLAN DETAIL)
// Dùng namespace "/details" (số nhiều) để chuẩn RESTful
// ==========================================
router.get("/details/:plan_detail_id/products", planDetailController.getPlanDetailProducts);
router.post("/details/:plan_detail_id/products", planDetailController.assignProducts);

// ==========================================
// 5. THAO TÁC TRÊN 1 SẢN PHẨM CỤ THỂ CỦA KHÁCH HÀNG
// Dùng namespace "/detail-products" cho các bản ghi đơn lẻ
// ==========================================
router.patch("/detail-products/:plan_detail_product_id/status", planDetailController.updateMeasurementStatus);
router.delete("/detail-products/:plan_detail_product_id", planDetailController.removeProduct);

module.exports = router;