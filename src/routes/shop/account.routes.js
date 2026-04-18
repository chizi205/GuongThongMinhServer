const express = require("express");
const router = express.Router();
const accountController = require("../../controllers/shop/account.controller");
const authShop = require("../../middleware/authShop"); // Import middleware

// Gắn middleware authShop vào tất cả API ở đây
router.get("/me", authShop, accountController.getMe);
router.put("/profile", authShop, accountController.updateProfile);
router.put("/change-password", authShop, accountController.changePassword);
router.put("/shop-settings", authShop, accountController.updateShopSettings);

module.exports = router;