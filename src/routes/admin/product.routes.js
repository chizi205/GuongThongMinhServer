const express = require("express");
const router = express.Router();
const productController = require("../../controllers/admin/product.controller");
const adminAuth = require("../../middleware/authAdmin");
const { uploadProductSingle, uploadVariantSingle } = require("../../middleware/multerUpload");

router.use(adminAuth);

router.get("/", productController.getProducts);
router.post("/", uploadProductSingle, productController.createProduct);
router.put("/:id", uploadProductSingle, productController.updateProduct);
router.delete("/:id", productController.deleteProduct);

router.post("/:productId/variants", uploadVariantSingle, productController.createVariant);
router.put("/variants/:variantId", uploadVariantSingle, productController.updateVariant);
router.delete("/variants/:variantId", productController.deleteVariant);

module.exports = router;