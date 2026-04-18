const db = require("../../config/database");

const getShopUsersByShopId = async (shop_id, searchKeyword = "") => {
  let query = `
    SELECT 
      u.id, 
      u.full_name, 
      u.phone, 
      u.email, 
      u.is_active as status,      -- Lấy is_active từ bảng users làm status
      su.first_seen_at as created_at -- Bảng shop_users dùng first_seen_at thay vì created_at
    FROM shop_users su
    JOIN users u ON su.user_id = u.id
    WHERE su.shop_id = $1 AND u.is_active = true -- Sửa is_deleted thành is_active
  `;
  const values = [shop_id];

  if (searchKeyword) {
    // Tìm kiếm trên bảng users (u)
    query += ` AND (u.full_name ILIKE $2 OR u.phone ILIKE $2)`;
    values.push(`%${searchKeyword}%`);
  }

  // Sắp xếp theo ngày khách hàng lần đầu tương tác với shop
  query += ` ORDER BY su.first_seen_at DESC;`;

  const { rows } = await db.query(query, values);
  return rows;
};

module.exports = {
  getShopUsersByShopId
};