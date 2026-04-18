const ShopService = require("../../services/shop/shop.service");

class ShopController {
  static async getShopsForRegistration(req, res) {
    try {
      const shops = await ShopService.getShopsForRegistration();

      return res.status(200).json({
        success: true,
        message: "Lấy danh sách shop thành công!",
        data: shops
      });
    } catch (error) {
      console.error("Lỗi getShopsForRegistration:", error);
      return res.status(500).json({
        success: false,
        message: "Đã xảy ra lỗi hệ thống khi lấy danh sách shop."
      });
    }
  }
}

module.exports = ShopController;