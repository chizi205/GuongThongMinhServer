const db = require("../../config/database");

const findStaffByUsername = async (username) => {
  const query = `
    SELECT 
      s.id, s.shop_id, s.username, s.password_hash AS password, s.role, s.is_active,
      sh.name as shop_name, sh.slug as shop_slug, sh.status as shop_status
    FROM shop_staffs s
    JOIN shops sh ON s.shop_id = sh.id
    WHERE s.username = $1 AND s.is_active = true
  `;
  
  const { rows } = await db.query(query, [username]);
  return rows[0]; // Trả về thông tin nhân viên hoặc undefined nếu không thấy
};

// Kiểm tra username đã tồn tại chưa
const checkUsernameExist = async (username) => {
  const { rows } = await db.query("SELECT id FROM shop_staffs WHERE username = $1", [username]);
  return rows.length > 0;
};

// Tạo tài khoản staff mới
const createStaff = async (staffData) => {
  const { shop_id, username, password_hash, email, phone } = staffData;
  
  // Lưu ý: 
  // - Không truyền 'role' vì DB sẽ tự lấy DEFAULT 'staff'
  // - Không truyền 'is_active' vì DB tự lấy DEFAULT true
  const query = `
    INSERT INTO shop_staffs (shop_id, username, password_hash, email, phone)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING id, shop_id, username, role, email, phone, is_active, created_at;
  `;
  
  const { rows } = await db.query(query, [shop_id, username, password_hash, email, phone]);
  return rows[0];
};

module.exports = {
    findStaffByUsername,
    checkUsernameExist,
    createStaff
};