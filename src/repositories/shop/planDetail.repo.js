const db = require("../../config/database");

// ==========================================
// 1. CÁC HÀM QUẢN LÝ KHÁCH HÀNG TRONG KẾ HOẠCH
// ==========================================

const checkPlanOwnership = async (plan_id, shop_id) => {
  const query = `
    SELECT id FROM measurement_plans 
    WHERE id = $1 AND shop_id = $2 AND is_deleted = false
  `;
  const { rows } = await db.query(query, [plan_id, shop_id]);
  return rows.length > 0;
};

const addUsersToPlan = async (plan_id, user_ids) => {
  const query = `
    INSERT INTO plan_details (plan_id, user_id)
    SELECT $1, unnest($2::uuid[])
    ON CONFLICT (plan_id, user_id) DO NOTHING
    RETURNING id, plan_id, user_id;
  `;
  
  const { rows } = await db.query(query, [plan_id, user_ids]);
  return rows; 
};

const getUsersByPlanId = async (plan_id) => {
  const query = `
    SELECT 
      u.id, 
      u.full_name, 
      u.phone, 
      u.email, 
      pd.id as plan_detail_id, 
      pd.note as plan_note, 
      pd.created_at
    FROM plan_details pd
    JOIN users u ON pd.user_id = u.id
    WHERE pd.plan_id = $1 AND u.is_active = true 
    ORDER BY pd.created_at DESC;
  `;
  
  const { rows } = await db.query(query, [plan_id]);
  return rows;
};

// ==========================================
// 2. CÁC HÀM QUẢN LÝ SẢN PHẨM CỦA KHÁCH HÀNG
// ==========================================

const getProductsByShopId = async (shop_id) => {
  const query = `
    SELECT id, name, image_url, base_price, category_id 
    FROM products 
    WHERE shop_id = $1 AND is_deleted = false AND status = 'active'
    ORDER BY created_at DESC
  `;
  const { rows } = await db.query(query, [shop_id]);
  return rows;
};

const addProductsToPlanDetail = async (plan_detail_id, product_ids) => {
  for (const product_id of product_ids) {
    const checkQuery = `SELECT id FROM plan_detail_products WHERE plan_detail_id = $1 AND product_id = $2`;
    const check = await db.query(checkQuery, [plan_detail_id, product_id]);
    
    if (check.rows.length === 0) {
      await db.query(
        `INSERT INTO plan_detail_products (plan_detail_id, product_id) VALUES ($1, $2)`,
        [plan_detail_id, product_id]
      );
    }
  }
  return true;
};

const getProductsOfPlanDetail = async (plan_detail_id) => {
  const query = `
    SELECT 
      pdp.id as plan_detail_product_id, 
      p.id as product_id, 
      p.name, 
      p.image_url,
      pdp.is_measured 
    FROM plan_detail_products pdp
    JOIN products p ON pdp.product_id = p.id
    WHERE pdp.plan_detail_id = $1 AND pdp.is_deleted = false
    ORDER BY pdp.created_at ASC
  `;
  const { rows } = await db.query(query, [plan_detail_id]);
  return rows;
};

// 2. THÊM hàm này để xóa mềm
const removeProductFromPlanDetail = async (plan_detail_product_id) => {
  const query = `
    UPDATE plan_detail_products 
    SET is_deleted = true 
    WHERE id = $1 
    RETURNING *;
  `;
  const { rows } = await db.query(query, [plan_detail_product_id]);
  return rows[0];
};

// Hàm mới: Cập nhật trạng thái đã đo
const updateProductMeasurementStatus = async (plan_detail_product_id, is_measured) => {
  const query = `
    UPDATE plan_detail_products 
    SET is_measured = $1 
    WHERE id = $2 
    RETURNING *;
  `;
  const { rows } = await db.query(query, [is_measured, plan_detail_product_id]);
  return rows[0];
};

module.exports = {
  checkPlanOwnership,
  addUsersToPlan,
  getByPlanId: getUsersByPlanId,
  getUsersByPlanId,
  getProductsByShopId,
  addProductsToPlanDetail,
  getProductsOfPlanDetail,
  updateProductMeasurementStatus,
  removeProductFromPlanDetail
};