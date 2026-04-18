const { pool } = require("../../config/database"); 

const getAccountById = async (id) => {
  const result = await pool.query(
    `
    SELECT id, username, email, full_name, role, is_active, last_login_at 
    FROM admins 
    WHERE id = $1
    `,
    [id]
  );
  return result.rows[0];
};

const updateProfile = async (id, { email, full_name, username }) => {
  const result = await pool.query(
    `
    UPDATE admins
    SET 
      email = COALESCE($1, email),
      full_name = COALESCE($2, full_name),
      username = COALESCE($3, username),
      updated_at = NOW()
    WHERE id = $4
    RETURNING id, username, email, full_name, role
    `,
    [email, full_name, username, id]
  );
  return result.rows[0];
};

const getPasswordHash = async (id) => {
  const result = await pool.query(`SELECT password_hash FROM admins WHERE id = $1`, [id]);
  return result.rows[0];
};

const updatePassword = async (id, newPasswordHash) => {
  await pool.query(
    `
    UPDATE admins 
    SET password_hash = $1, updated_at = NOW() 
    WHERE id = $2
    `,
    [newPasswordHash, id]
  );
};

const updateShopConfig = async (shopId, { zalo_oa_id }) => {
  // SỬA TẠI ĐÂY: Đổi db thành pool
  await pool.query(
    `
    UPDATE shops 
    SET zalo_oa_id = $1, updated_at = NOW() 
    WHERE id = $2
    `,
    [zalo_oa_id, shopId]
  );
};

// SỬA TẠI ĐÂY: Dùng {} thay vì [] để Service gọi hàm dễ dàng hơn
module.exports = {
    getAccountById,
    updateProfile,
    updateShopConfig,
    getPasswordHash,
    updatePassword
};