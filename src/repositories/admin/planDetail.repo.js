const {pool} = require("../../config/database");

// Admin chỉ cần check kế hoạch có tồn tại hay không
const checkPlanExists = async (plan_id) => {
  const query = `SELECT id FROM measurement_plans WHERE id = $1 AND is_deleted = false`;
  const { rows } = await pool.query(query, [plan_id]);
  return rows.length > 0;
};

const getProductsByShopId = async (shop_id) => {
  const query = `
    SELECT id, name, image_url, base_price, category_id 
    FROM products WHERE shop_id = $1 AND is_deleted = false AND status = 'active'
    ORDER BY created_at DESC
  `;
  const { rows } = await pool.query(query, [shop_id]);
  return rows;
};

// SỬA LẠI: Dùng DO UPDATE để khôi phục (is_deleted = false) nếu khách hàng đã từng bị gỡ mềm
const addUsersToPlan = async (plan_id, user_ids) => {
  const query = `
    INSERT INTO plan_details (plan_id, user_id, is_deleted)
    SELECT $1, unnest($2::uuid[]), false
    ON CONFLICT (plan_id, user_id) 
    DO UPDATE SET 
        is_deleted = false, 
        status = 'waiting',
        updated_at = CURRENT_TIMESTAMP
    RETURNING id, plan_id, user_id;
  `;
  const { rows } = await pool.query(query, [plan_id, user_ids]);
  return rows; 
};

// SỬA LẠI: Thêm điều kiện pd.is_deleted = false
const getUsersByPlanId = async (plan_id) => {
  const query = `
    SELECT u.id, u.full_name, u.phone, u.email, pd.id as plan_detail_id, pd.note as plan_note, pd.created_at
    FROM plan_details pd JOIN users u ON pd.user_id = u.id
    WHERE pd.plan_id = $1 AND u.is_active = true AND pd.is_deleted = false 
    ORDER BY pd.created_at DESC;
  `;
  const { rows } = await pool.query(query, [plan_id]);
  return rows;
};

// SỬA LẠI: Cập nhật logic để khôi phục sản phẩm nếu đã từng bị gỡ mềm trước đó
const addProductsToPlanDetail = async (plan_detail_id, product_ids) => {
  for (const product_id of product_ids) {
    const checkQuery = `SELECT id, is_deleted FROM plan_detail_products WHERE plan_detail_id = $1 AND product_id = $2`;
    const check = await pool.query(checkQuery, [plan_detail_id, product_id]);
    
    if (check.rows.length === 0) {
      // Chưa từng tồn tại -> Thêm mới
      await pool.query(`INSERT INTO plan_detail_products (plan_detail_id, product_id) VALUES ($1, $2)`, [plan_detail_id, product_id]);
    } else if (check.rows[0].is_deleted) {
      // Đã tồn tại nhưng bị gỡ -> Khôi phục lại trạng thái chờ đo
      await pool.query(
        `UPDATE plan_detail_products SET is_deleted = false, is_measured = false WHERE id = $1`, 
        [check.rows[0].id]
      );
    }
  }
  return true;
};

const getProductsOfPlanDetail = async (plan_detail_id) => {
  const query = `
    SELECT pdp.id as plan_detail_product_id, p.id as product_id, p.name, p.image_url, pdp.is_measured 
    FROM plan_detail_products pdp JOIN products p ON pdp.product_id = p.id
    WHERE pdp.plan_detail_id = $1 AND pdp.is_deleted = false 
    ORDER BY pdp.created_at ASC
  `;
  const { rows } = await pool.query(query, [plan_detail_id]);
  return rows;
};

const updateProductMeasurementStatus = async (plan_detail_product_id, is_measured) => {
  const query = `UPDATE plan_detail_products SET is_measured = $1 WHERE id = $2 RETURNING *;`;
  const { rows } = await pool.query(query, [is_measured, plan_detail_product_id]);
  return rows[0];
};

const removeProductFromPlanDetail = async (plan_detail_product_id) => {
  const query = `UPDATE plan_detail_products SET is_deleted = true WHERE id = $1 RETURNING *;`;
  const { rows } = await pool.query(query, [plan_detail_product_id]);
  return rows[0];
};

// THÊM MỚI: Hàm gỡ khách hàng khỏi kế hoạch (Transaction)
const removeUserFromPlan = async (plan_detail_id) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // 1. Gỡ mềm khách hàng
    const updatePlanDetailQuery = `UPDATE plan_details SET is_deleted = true WHERE id = $1 RETURNING *`;
    const { rows } = await client.query(updatePlanDetailQuery, [plan_detail_id]);
    
    if (rows.length === 0) {
      throw new Error("NOT_FOUND");
    }

    // 2. Gỡ mềm tất cả các sản phẩm đang gán cho khách hàng này
    const updateProductsQuery = `UPDATE plan_detail_products SET is_deleted = true WHERE plan_detail_id = $1`;
    await client.query(updateProductsQuery, [plan_detail_id]);

    await client.query('COMMIT');
    return rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

module.exports = {
  checkPlanExists, 
  getProductsByShopId, 
  addUsersToPlan, 
  getUsersByPlanId,
  addProductsToPlanDetail, 
  getProductsOfPlanDetail, 
  updateProductMeasurementStatus, 
  removeProductFromPlanDetail,
  removeUserFromPlan
};