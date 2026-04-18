const shopUserService = require("../../services/shop/shopUser.service");

const getShopUsers = async (req, res) => {
  try {
    // Lấy shop_id từ token đăng nhập
    const shop_id = req.shop_user?.shop_id; 
    
    if (!shop_id) {
      return res.status(400).json({ 
        success: false, 
        message: "Không lấy được shop_id từ Token." 
      });
    }

    // Lấy từ khóa tìm kiếm từ query params (VD: /api/shop/users?search=0987)
    const searchKeyword = req.query.search || ""; 

    const users = await shopUserService.getShopUsersService(shop_id, searchKeyword);

    return res.status(200).json({
      success: true,
      message: "Lấy danh sách khách hàng thành công!",
      data: users
    });
  } catch (error) {
    console.error("Lỗi Controller getShopUsers:", error);
    if (error.message.startsWith("BAD_REQUEST")) {
      return res.status(400).json({ success: false, message: error.message.replace("BAD_REQUEST: ", "") });
    }
    return res.status(500).json({ success: false, message: "Đã xảy ra lỗi hệ thống." });
  }
};

module.exports = {
  getShopUsers
};