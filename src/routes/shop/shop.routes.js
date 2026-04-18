const express = require("express");
const router = express.Router();
const ShopController = require("../../controllers/shop/shop.controller");

// API lấy danh sách shop để chọn khi đăng ký
router.get("/", ShopController.getShopsForRegistration);

module.exports = router;