const authService = require("../../services/shop/auth.service");
const { ok, badRequest, serverError } = require("../../utils/response");

const login = async (req, res) => {
  try {
    const { username, password } = req.body;
    const data = await authService.login(username, password);
    return ok(res, 200, data, "Đăng nhập Shop thành công");
  } catch (err) {
    console.log(err)
    if (["Vui lòng", "chính xác", "tồn tại", "khóa"].some(w => err.message.includes(w))) {
      return badRequest(res, err.message);
    }
    return serverError(res, err.message);
  }
};

const register = async (req, res) => {
  try {
    // Gọi thẳng Service và truyền req.body vào
    const data = await authService.register(req.body);
    
    // Sử dụng hàm ok() từ utils/response.js cho đồng bộ với login
    return ok(res, 201, data, "Đăng ký tài khoản nhân viên thành công!");
  } catch (err) {
    console.error("Lỗi đăng ký tài khoản:", err);
    
    // Bắt các lỗi validate từ Service ném ra để trả về 400 Bad Request
    if (["Vui lòng", "không khớp", "tồn tại"].some(w => err.message.includes(w))) {
      return badRequest(res, err.message);
    }
    
    // Các lỗi còn lại là lỗi server
    return serverError(res, "Đã xảy ra lỗi từ phía máy chủ.");
  }
};

module.exports = {
  login,
  register
};