const accountService = require("../../services/admin/account.service");

const getMe = async (req, res) => {
  try {
    // Lưu ý: Tùy vào middleware auth của bạn gán req.user hay req.admin, bạn giữ nguyên nhé
    const account = await accountService.getMe(req.user?.id || req.admin?.id);
    
    if (!account) {
      return res.status(404).json({ success: false, message: "Không tìm thấy thông tin tài khoản" });
    }
    
    return res.status(200).json({ success: true, data: account });
  } catch (error) {
    console.error("Lỗi getMe:", error);
    return res.status(500).json({ success: false, message: "Lỗi máy chủ khi lấy thông tin" });
  }
};

const updateProfile = async (req, res) => {
  try {
    const updated = await accountService.updateProfile(req.user?.id || req.admin?.id, req.body);
    return res.status(200).json({ 
      success: true, 
      data: updated, 
      message: "Cập nhật thành công" 
    });
  } catch (error) {
    console.error("Lỗi updateProfile:", error);
    // Trả về 400 (Bad Request) để frontend lấy được câu báo lỗi cụ thể (VD: "Mật khẩu xác nhận không đúng")
    return res.status(400).json({ success: false, message: error.message || "Lỗi cập nhật hồ sơ" });
  }
};

const updateShopSettings = async (req, res) => {
  try {
    await accountService.updateShopSettings(req.user?.id || req.admin?.id, req.body);
    return res.status(200).json({ success: true, message: "Cập nhật cấu hình Shop thành công" });
  } catch (error) {
    console.error("Lỗi updateShopSettings:", error);
    return res.status(400).json({ success: false, message: error.message || "Lỗi cập nhật cấu hình shop" });
  }
};

const changePassword = async (req, res) => {
  try {
    await accountService.changePassword(req.user?.id || req.admin?.id, req.body);
    return res.status(200).json({ success: true, message: "Đổi mật khẩu thành công" });
  } catch (error) {
    console.error("Lỗi changePassword:", error);
    return res.status(400).json({ success: false, message: error.message || "Lỗi đổi mật khẩu" });
  }
};

module.exports = {
  getMe,
  updateProfile,
  updateShopSettings,
  changePassword,
};