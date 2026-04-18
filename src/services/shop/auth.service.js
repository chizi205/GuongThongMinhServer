const bcrypt = require("bcrypt"); // Hoặc bcryptjs tùy bạn đang cài thư viện nào
const jwt = require("jsonwebtoken");
const authRepo = require("../../repositories/shop/auth.repo");

const login = async (username, password) => {
  if (!username || !password) {
    throw new Error("Vui lòng nhập đầy đủ tài khoản và mật khẩu");
  }

  // 1. Tìm tài khoản nhân viên
  const staff = await authRepo.findStaffByUsername(username);
  if (!staff) {
    throw new Error("Tài khoản không tồn tại hoặc đã bị khóa");
  }

  // 2. Kiểm tra Shop có đang bị Admin khóa không
  if (staff.shop_status !== "active") {
    throw new Error("Cửa hàng của bạn hiện đang bị khóa trên hệ thống");
  }

  // 3. Kiểm tra mật khẩu
  const isMatch = await bcrypt.compare(password, staff.password);
  if (!isMatch) {
    throw new Error("Mật khẩu không chính xác");
  }

  // 4. Khởi tạo Payload để ký Token
  const payload = {
    id: staff.id,
    shop_id: staff.shop_id,
    username: staff.username,
    role: staff.role, 
    type: "shop", 
  };

  const SECRET_KEY = process.env.JWT_SECRET || "access_secret_key";
  const accessToken = jwt.sign(payload, SECRET_KEY, { expiresIn: "1d" });

  return {
    user: {
      id: staff.id,
      username: staff.username,
      full_name: staff.full_name,
      role: staff.role,
      shop_id: staff.shop_id,
      shop_name: staff.shop_name,
      shop_slug: staff.shop_slug,
    },
    accessToken
  };
};

const register = async (data) => {
  const { shop_id, username, password, confirm_password, email, phone } = data;

  // 1. Validate các trường bắt buộc
  if (!shop_id || !username || !password || !confirm_password) {
    throw new Error("Vui lòng nhập đầy đủ các thông tin bắt buộc: shop_id, username, password, confirm_password.");
  }

  // 2. Kiểm tra mật khẩu xác nhận
  if (password !== confirm_password) {
    throw new Error("Mật khẩu và xác nhận mật khẩu không khớp.");
  }

  // 3. Kiểm tra username đã tồn tại chưa
  const isExist = await authRepo.checkUsernameExist(username);
  if (isExist) {
    throw new Error("Tên đăng nhập (username) đã tồn tại. Vui lòng chọn tên khác.");
  }

  // 4. Mã hóa mật khẩu thành chuỗi hash
  const saltRounds = 10;
  const password_hash = await bcrypt.hash(password, saltRounds);

  // 5. Chuẩn bị data gửi xuống Repo
  const newStaffData = {
    shop_id,
    username,
    password_hash,
    email: email || null,
    phone: phone || null
  };

  // 6. Thực thi lệnh Insert
  const newStaff = await authRepo.createStaff(newStaffData);
  return newStaff;
};

module.exports = {
  login,
  register
};