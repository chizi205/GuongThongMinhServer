const express = require("express");
const router = express.Router();
const measurementPlanController = require("../../controllers/admin/measurementPlan.controller");
const planDetailController = require("../../controllers/admin/planDetail.controller");
const authAdmin = require("../../middleware/authAdmin"); // Dùng auth của Admin

// Bắt buộc xác thực Admin
router.use(authAdmin);

// ==========================================
// 1. API TIỆN ÍCH (LOOKUP)
// ==========================================
// Lấy danh sách sản phẩm của 1 shop (truyền ?shop_id=...)
router.get("/shop-products", planDetailController.getShopProducts);

// ==========================================
// 2. KẾ HOẠCH ĐO (MEASUREMENT PLANS)
// ==========================================
router.post("/", measurementPlanController.createPlan);
router.get("/", measurementPlanController.getPlans)
router.put("/:id", measurementPlanController.updatePlan);
router.delete("/:id", measurementPlanController.deletePlan);

// ==========================================
// 3. KHÁCH HÀNG TRONG KẾ HOẠCH (PLAN DETAILS)
// ==========================================
router.get("/:planId/users", planDetailController.getUsersInPlan);
router.post("/:planId/users", planDetailController.addUsersToPlan);
router.delete("/details/:id", planDetailController.removeUserFromPlan);

// ==========================================
// 4. SẢN PHẨM CỦA 1 KHÁCH HÀNG
// ==========================================
router.get("/details/:plan_detail_id/products", planDetailController.getPlanDetailProducts);
router.post("/details/:plan_detail_id/products", planDetailController.assignProducts);

// ==========================================
// 5. THAO TÁC TRÊN 1 SẢN PHẨM CỤ THỂ
// ==========================================
router.patch("/detail-products/:plan_detail_product_id/status", planDetailController.updateMeasurementStatus);
router.delete("/detail-products/:plan_detail_product_id", planDetailController.removeProduct);

router.get("/:id/export", measurementPlanController.exportExcel);

module.exports = router;