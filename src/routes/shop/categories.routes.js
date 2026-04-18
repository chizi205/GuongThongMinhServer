const express = require("express");
const router = express.Router();

const CategoryController = require("../../controllers/shop/category.controller");
const kioskAuth = require("../../middleware/authKiosk");

router.get("/", kioskAuth, CategoryController.getCategoriesByShop);

router.get(
  "/:categoryId/sizes",
  kioskAuth,
  CategoryController.getSizesByCategory,
);

module.exports = router;
