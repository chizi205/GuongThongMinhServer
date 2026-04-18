const express = require("express");
const router = express.Router();

const controller = require("../../controllers/measurementPlan/planDetail.controller");
const staffAuth = require("../../middleware/authStaff");

router.get("/:plan_id/customers", staffAuth, controller.getCustomers);
router.get("/:plan_detail_id/products",staffAuth, controller.getProductsByUser);
router.get("/products/:product_id/params", staffAuth, controller.getProductParams);
router.post("/details/:plan_detail_id/measurements", staffAuth, controller.saveMeasurements);
module.exports = router;