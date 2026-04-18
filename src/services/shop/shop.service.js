const ShopRepository = require("../../repositories/shop/shop.repo");

class ShopService {
  static async getShopsForRegistration() {
    // Gọi hàm từ class ShopRepository
    const shops = await ShopRepository.getActiveShops();
    return shops;
  }
}

module.exports = ShopService;