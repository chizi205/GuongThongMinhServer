const express = require("express");
const router = express.Router();
const accountController = require("../../controllers/admin/account.controller");
const auth = require("../../middleware/authAdmin");

router.get("/me", auth, accountController.getMe);
router.put("/profile", auth, accountController.updateProfile);
router.put("/change-password", auth, accountController.changePassword);
router.put("/shop-settings", auth, accountController.updateShopSettings);

module.exports = router;
