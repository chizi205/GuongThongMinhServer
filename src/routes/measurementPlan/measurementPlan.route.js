const express = require("express");
const router = express.Router();
const sizeController = require("../../controllers/measurementPlan/size.controller");
const controller = require("../../controllers/measurementPlan/measurementPlan.controller");
const staffAuth = require("../../middleware/authStaff");

router.patch("/:id/bulk-measurements", controller.bulkUpdateUserMeasurements);

router.post("/category-sizes", sizeController.updateCategorySizes);

router.get("/quick-select", sizeController.getProductsByQuickSize);

router.get("/", staffAuth, controller.getPlans);

router.patch("/details/:plan_detail_id/note", controller.updatePlanDetailNote);

module.exports = router;
