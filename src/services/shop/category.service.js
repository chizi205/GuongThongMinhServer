const CategoryRepo = require("../../repositories/shop/category.repo");

const CategoryService = {
  async getCategoriesByShop(shopId) {
    if (!shopId) {
      throw new Error("shopId is required");
    }

    const categories = await CategoryRepo.getByShopId(shopId);

    return categories;
  },

  async getSizesByCategory(categoryId) {
    if (!categoryId) {
      throw new Error("categoryId is required");
    }

    const sizes = await CategoryRepo.getSizesByCategoryId(categoryId);

    return sizes;
  },
};

module.exports = CategoryService;
