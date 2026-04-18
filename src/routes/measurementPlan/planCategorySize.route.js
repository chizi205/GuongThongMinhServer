const express = require("express");
const router = express.Router();
const controller = require("../../controllers/measurementPlan/planCategorySizeController");
const staffAuth = require("../../middleware/authStaff");

router.post("/", staffAuth, controller.create);
router.get("/:plan_id", staffAuth, controller.getByPlanDetailId);
router.put("/:id", staffAuth, controller.update);
router.delete("/:id", staffAuth, controller.remove);

module.exports = router;
