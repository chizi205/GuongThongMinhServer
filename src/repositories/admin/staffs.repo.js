const { pool } = require("../../config/database");

const getStaffs = async ({ shop_id, keyword, role, limit = 10, offset = 0 }) => {
  let query = `
    SELECT id, shop_id, username, email, phone, role, is_active, created_at, 'shop_staff' as source_type
    FROM shop_staffs
    UNION ALL
    SELECT id, NULL as shop_id, username, email, NULL as phone, 'Platform Admin' as role, is_active, created_at, 'admin' as source_type
    FROM admins
  `;
  
  let finalQuery = `SELECT * FROM (${query}) AS combined WHERE 1=1`;
  const params = [];

  if (shop_id) {
    params.push(shop_id);
    finalQuery += ` AND (shop_id = $${params.length} OR source_type = 'admin')`;
  }

  if (keyword) {
    params.push(`%${keyword}%`);
    finalQuery += ` AND (username ILIKE $${params.length} OR email ILIKE $${params.length})`;
  }

  if (role) {
    params.push(role);
    finalQuery += ` AND role = $${params.length}`;
  }

  finalQuery += ` ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`;
  const res = await pool.query(finalQuery, params);
  return res.rows;
};

const getStaffById = async (id) => {
  let query = `
    SELECT id, shop_id, username, email, phone, role, is_active, created_at, 'shop_staff' as source_type
    FROM shop_staffs WHERE id = $1
    UNION ALL
    SELECT id, NULL as shop_id, username, email, NULL as phone, 'Platform Admin' as role, is_active, created_at, 'admin' as source_type
    FROM admins WHERE id = $1
  `;
  const res = await pool.query(query, [id]);
  return res.rows[0];
};

// ĐÃ SỬA: Dùng Upsert để khôi phục và đè thông tin nếu username đã tồn tại trong shop
const createStaff = async (data) => {
  const { shop_id, username, password_hash, role, email, phone } = data;
  const res = await pool.query(
    `INSERT INTO shop_staffs (shop_id, username, password_hash, role, email, phone, is_active) 
     VALUES ($1, $2, $3, $4, $5, $6, true) 
     ON CONFLICT (shop_id, username) 
     DO UPDATE SET 
        password_hash = EXCLUDED.password_hash,
        role = EXCLUDED.role,
        email = EXCLUDED.email,
        phone = EXCLUDED.phone,
        is_active = true,
        updated_at = NOW()
     RETURNING id, username, role, email`,
    [shop_id, username, password_hash, role, email, phone]
  );
  return res.rows[0];
};

const updateStaff = async (id, data) => {
  const { role, email, phone } = data;
  const res = await pool.query(
    `UPDATE shop_staffs SET role = COALESCE($1, role), email = COALESCE($2, email), phone = COALESCE($3, phone), updated_at = NOW() WHERE id = $4 RETURNING id, username, role`,
    [role, email, phone, id]
  );
  return res.rows[0];
};

const deleteStaff = async (id) => {
  await pool.query(`DELETE FROM shop_staffs WHERE id = $1`, [id]);
};

// Khóa hoặc mở khóa tài khoản
const lockStaff = async (id, is_active) => {
  const res = await pool.query(
    `UPDATE shop_staffs SET is_active = $1, updated_at = NOW() WHERE id = $2 RETURNING id, is_active`,
    [is_active, id]
  );
  return res.rows[0];
};

// Đổi mật khẩu
const resetPassword = async (id, password_hash) => {
  await pool.query(
    `UPDATE shop_staffs SET password_hash = $1, updated_at = NOW() WHERE id = $2`,
    [password_hash, id]
  );
  return true;
};

// ĐÃ SỬA: Cập nhật Upsert tương tự cho hàm thêm nhiều nhân viên
const createMultipleStaffs = async (staffs) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const insertedStaffs = [];
    
    for (const staff of staffs) {
      const { shop_id, username, password_hash, role, email, phone } = staff;
      const res = await client.query(
        `INSERT INTO shop_staffs (shop_id, username, password_hash, role, email, phone, is_active) 
         VALUES ($1, $2, $3, $4, $5, $6, true) 
         ON CONFLICT (shop_id, username) 
         DO UPDATE SET 
            password_hash = EXCLUDED.password_hash,
            role = EXCLUDED.role,
            email = EXCLUDED.email,
            phone = EXCLUDED.phone,
            is_active = true,
            updated_at = NOW()
         RETURNING id, username, role, email`,
        [shop_id, username, password_hash, role, email, phone]
      );
      insertedStaffs.push(res.rows[0]);
    }
    
    await client.query('COMMIT');
    return insertedStaffs;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error; 
  } finally {
    client.release();
  }
};

module.exports = {
  getStaffs,
  getStaffById,
  createStaff,
  updateStaff,
  deleteStaff,
  lockStaff,
  resetPassword,
  createMultipleStaffs
};