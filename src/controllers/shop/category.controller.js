const CategoryService = require("../../services/shop/category.service");

const CategoryController = {
  async getCategoriesByShop(req, res) {
    try {
      const shopId = req.kiosk.shop_id;

      const data = await CategoryService.getCategoriesByShop(shopId);

      return res.json({
        success: true,
        data,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },

  async getSizesByCategory(req, res) {
    try {
      const { categoryId } = req.params;

      const data = await CategoryService.getSizesByCategory(categoryId);

      return res.json({
        success: true,
        data,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },
};

module.exports = CategoryController;
