const db = require("../../config/database");

// ==========================================
// 1. Tạo mới
// ==========================================
const createPlanCategorySize = async (plan_id, category_id) => {
  const query = `
    INSERT INTO plan_category_sizes (plan_id, category_id)
    VALUES ($1, $2)
    RETURNING *;
  `;
  const result = await db.query(query, [plan_id, category_id]);
  return result.rows[0];
};
// ==========================================
// 2. Lấy theo plan_detail_id
// ==========================================
const getByPlanDetailId = async (plan_id) => {
  const query = `
    SELECT pcs.*, cs.price, cs.stock
    FROM plan_category_sizes pcs
    JOIN category_sizes cs ON pcs.category_id = cs.id
    WHERE pcs.plan_id = $1
    ORDER BY pcs.created_at DESC;
  `;
  const result = await db.query(query, [plan_id]);
  return result.rows;
};
// ==========================================
// 3. Update
// ==========================================
const updatePlanCategorySize = async (id, category_id) => {
  const query = `
    UPDATE plan_category_sizes
    SET category_id = $2,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = $1
    RETURNING *;
  `;
  const result = await db.query(query, [id, category_id]);
  return result.rows[0];
};
// ==========================================
// 4. Xóa (soft delete nếu cần)
// ==========================================
const deletePlanCategorySize = async (id) => {
  const query = `
    DELETE FROM plan_category_sizes
    WHERE id = $1
    RETURNING *;
  `;
  const result = await db.query(query, [id]);
  return result.rows[0];
};
// ==========================================
// 5. Kiểm tra tồn tại (tránh duplicate)
// ==========================================
const checkExists = async (plan_id, category_id) => {
  const query = `
    SELECT 1
    FROM plan_category_sizes
    WHERE plan_id = $1 AND category_id = $2
    LIMIT 1;
  `;
  const result = await db.query(query, [plan_id, category_id]);
  return result.rowCount > 0;
};
module.exports = {
  createPlanCategorySize,
  getByPlanDetailId,
  updatePlanCategorySize,
  deletePlanCategorySize,
  checkExists,
};
