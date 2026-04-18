const jwt = require("jsonwebtoken");
const { isPlatformRole } = require("../constants/adminRoles");

module.exports = (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    // 1. Kiểm tra token tồn tại (xử lý cả trường hợp FE gửi chuỗi "null"/"undefined")
    if (!token || token === "undefined" || token === "null") {
      console.log("Middleware: Không tìm thấy Token");
      return res.status(401).json({ 
        success: false, 
        message: "Phiên đăng nhập không tồn tại, vui lòng đăng nhập lại!" 
      });
    }

    // 2. SECRET_KEY phải khớp 100% với file auth.service.js và file .env
    const SECRET_KEY = process.env.JWT_SECRET || "access_secret_key"; 

    jwt.verify(token, SECRET_KEY, (err, decoded) => {
      if (err) {
        console.error("Middleware: Giải mã thất bại -", err.message);
        return res.status(401).json({ 
          success: false, 
          message: "Phiên đăng nhập hết hạn hoặc không hợp lệ!" 
        });
      }

      // 3. Lưu thông tin vào req để các Controller sử dụng (req.user.id, req.user.role,...)
      // Gắn thêm flag kiểm tra quyền Admin tổng từ file adminRoles.js của Tính
      req.user = {
        ...decoded,
        is_platform_admin: isPlatformRole(decoded.role),
      };

      console.log(
        `Middleware: OK User [${decoded.id}] - Role [${decoded.role}]`
      );
      next();
    });
  } catch (err) {
    console.error("Middleware: Lỗi hệ thống -", err.message);
    return res.status(500).json({ 
      success: false, 
      message: "Lỗi hệ thống Middleware" 
    });
  }
};