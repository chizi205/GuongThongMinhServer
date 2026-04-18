const express = require("express");
const router = express.Router();
const orderController = require("../../controllers/admin/order.controller");
const auth = require("../../middleware/authAdmin");

router.use(auth);

router.get("/stats", orderController.getStats);

router.get("/", orderController.getOrders);

router.get("/:id", orderController.getOrderDetail);


router.put("/:id", orderController.updateOrder);

module.exports = router;