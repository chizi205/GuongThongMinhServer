const db = require("../../config/database");

const createMeasurementPlan = async (planData) => {
  const { shop_id, name, note, status, created_by } = planData;
  
  const query = `
    INSERT INTO measurement_plans (shop_id, name, note, status, created_by)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING id, shop_id, name, note, status, created_by, created_at;
  `;
  
  const { rows } = await db.query(query, [shop_id, name, note, status, created_by]);
  return rows[0];
};

const getPlansByShopId = async (shop_id, searchKeyword = "") => {
  let query = `
    SELECT id, shop_id, name, note, status, created_by, created_at, updated_at
    FROM measurement_plans
    WHERE shop_id = $1 AND is_deleted = false
  `;
  const values = [shop_id];

  // Nếu có từ khóa tìm kiếm (so sánh không phân biệt hoa thường với ILIKE)
  if (searchKeyword) {
    query += ` AND name ILIKE $2`;
    values.push(`%${searchKeyword}%`);
  }

  query += ` ORDER BY created_at DESC;`;

  const { rows } = await db.query(query, values);
  return rows;
};

// 2. Cập nhật (Sửa)
const updatePlan = async (id, shop_id, updateData) => {
  const { name, note, status } = updateData;
  
  const query = `
    UPDATE measurement_plans
    SET 
      name = COALESCE($1, name),
      note = COALESCE($2, note),
      status = COALESCE($3, status),
      updated_at = NOW()
    WHERE id = $4 AND shop_id = $5 AND is_deleted = false
    RETURNING id, shop_id, name, note, status, updated_at;
  `;
  
  const { rows } = await db.query(query, [name, note, status, id, shop_id]);
  return rows[0];
};

// 3. Xóa mềm (Soft Delete)
const deletePlan = async (id, shop_id) => {
  const query = `
    UPDATE measurement_plans
    SET is_deleted = true, updated_at = NOW()
    WHERE id = $1 AND shop_id = $2 AND is_deleted = false
    RETURNING id;
  `;
  
  const { rows } = await db.query(query, [id, shop_id]);
  return rows[0];
};

module.exports = {
  createMeasurementPlan,
  getPlansByShopId,
  updatePlan,
  deletePlan
};