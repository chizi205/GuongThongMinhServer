const { ok, serverError } = require("../../utils/response");

const getMe = async (req, res) => {
  try {
    // Thông tin này lấy từ Token đã được giải mã ở authShop.js
    const shopUser = req.shop_user; 
    return ok(res, 200, shopUser, "Lấy thông tin tài khoản Shop thành công");
  } catch (err) {
    return serverError(res, err.message);
  }
};

const updateProfile = async (req, res) => {
  try {
    // Sau này bạn gọi AccountService ở đây để update DB
    return ok(res, 200, {}, "Cập nhật hồ sơ thành công");
  } catch (err) {
    return serverError(res, err.message);
  }
};

const changePassword = async (req, res) => {
  try {
    // Sau này bạn gọi AccountService ở đây để đổi pass
    return ok(res, 200, {}, "Đổi mật khẩu thành công");
  } catch (err) {
    return serverError(res, err.message);
  }
};

const updateShopSettings = async (req, res) => {
  try {
    // Sau này bạn gọi ShopService ở đây để update cài đặt của Shop
    return ok(res, 200, {}, "Cập nhật cài đặt cửa hàng thành công");
  } catch (err) {
    return serverError(res, err.message);
  }
};

module.exports = {
  getMe,
  updateProfile,
  changePassword,
  updateShopSettings
};