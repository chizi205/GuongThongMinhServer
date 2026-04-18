const express = require("express");
const router = express.Router();
const shopUserController = require("../../controllers/shop/shopUser.controller");
const authShop = require("../../middleware/authShop");

// Bật middleware bảo vệ bằng Token cho toàn bộ các API ở dưới
router.use(authShop);

// API GET /api/shop/users
// (Hoặc có tìm kiếm: /api/shop/users?search=keyword)
router.get("/", shopUserController.getShopUsers);

module.exports = router;