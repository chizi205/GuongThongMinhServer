const jwt = require("jsonwebtoken");

module.exports = function authShop(req, res, next) {
  try {
    const authHeader = req.headers["authorization"] || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : authHeader.split(" ")[1];

    if (!token || token === "undefined" || token === "null") {
      return res.status(401).json({ success: false, message: "MISSING_TOKEN: Phiên đăng nhập không tồn tại!" });
    }

    const SECRET_KEY = process.env.JWT_SECRET || "access_secret_key";
    const decoded = jwt.verify(token, SECRET_KEY);

    // Bắt buộc type trong token phải là "shop" để không bị lẫn với Admin hay Khách hàng
    if (!decoded || decoded.type !== "shop") {
      return res.status(403).json({ success: false, message: "FORBIDDEN: Bạn không có quyền truy cập khu vực quản trị Shop!" });
    }

    // Gắn thông tin tài khoản (có chứa shop_id) vào req để các API sau dùng
    req.shop_user = decoded; 
    
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: "TOKEN_EXPIRED: Phiên đăng nhập hết hạn hoặc không hợp lệ!" });
  }
};