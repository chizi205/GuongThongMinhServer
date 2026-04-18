const express = require("express");
const router = express.Router();
const categoryController = require("../../controllers/admin/category.controller");
const adminAuth = require("../../middleware/authAdmin");

router.get("/", adminAuth, categoryController.getCategories);
router.post("/", adminAuth, categoryController.createCategory);
router.put("/:id", adminAuth, categoryController.updateCategory);
router.delete("/:id", adminAuth, categoryController.deleteCategory);
router.get("/all-sizes", adminAuth, categoryController.getAllSizes);
router.get("/:id/sizes", adminAuth, categoryController.getCategorySizes);

// Endpoint riêng để quản lý thông số đo nếu không muốn sửa cả danh mục
router.get("/:id/measurement-params", adminAuth, categoryController.getParams);
router.put("/:id/measurement-params", adminAuth, categoryController.syncParams);

module.exports = router;