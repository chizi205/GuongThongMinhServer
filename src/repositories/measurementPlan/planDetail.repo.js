const db = require("../../config/database");

const getProductsByPlanDetailId = async (plan_detail_id) => {
  const query = `
    SELECT 
      pdp.id AS plan_detail_product_id,
      p.id AS product_id,
      p.name AS product_name,
      p.image_url,
      pdp.is_measured,
      pdp.created_at
    FROM plan_detail_products pdp
    JOIN products p ON pdp.product_id = p.id
    WHERE pdp.plan_detail_id = $1 
      AND pdp.is_deleted = false
    ORDER BY pdp.created_at DESC;
  `;
  const result = await db.query(query, [plan_detail_id]);
  return result.rows;
};

const getCustomersByPlan = async ({ plan_id }) => {
  const result = await db.query(
    `
    SELECT 
      pd.id AS plan_detail_id,
      c.id AS customer_id,
      c.full_name,
      c.phone,
      pd.status,
      pd.created_at
    FROM plan_details pd
    JOIN users c ON pd.user_id = c.id
    WHERE pd.plan_id = $1
    ORDER BY pd.created_at DESC
    `,
    [plan_id],
  );
  return result.rows;
};

const getMeasurementParamsByProductId = async (product_id) => {
  const query = `
    SELECT 
      cmp.id AS param_id,
      cmp.name AS param_name,
      cmp.code AS param_code,
      cmp.unit
    FROM products p
    JOIN category_measurement_params cmp ON p.category_id = cmp.category_id
    WHERE p.id = $1
    ORDER BY cmp.sort_order ASC;
  `;
  const result = await db.query(query, [product_id]);
  return result.rows;
};

const saveMeasurementValue = async (plan_detail_id, param_id, measured_value) => {
  const query = `
    INSERT INTO plan_detail_measurements (plan_detail_id, param_id, measured_value)
    VALUES ($1, $2, $3)
    ON CONFLICT (plan_detail_id, param_id) 
    DO UPDATE SET 
      measured_value = EXCLUDED.measured_value,
      updated_at = CURRENT_TIMESTAMP
    RETURNING *;
  `;
  const result = await db.query(query, [plan_detail_id, param_id, measured_value]);
  return result.rows[0];
};

// ==============================================================
// CÁC HÀM CẬP NHẬT TRẠNG THÁI (HIỆU ỨNG DOMINO)
// ==============================================================

const markProductAsMeasured = async (plan_detail_id, product_id) => {
  const query = `
    UPDATE plan_detail_products 
    SET is_measured = true 
    WHERE plan_detail_id = $1 AND product_id = $2
    RETURNING *;
  `;
  const result = await db.query(query, [plan_detail_id, product_id]);
  return result.rows[0];
};

const checkAndUpdateCustomerStatus = async (plan_detail_id) => {
  const checkQuery = `
    SELECT count(*) 
    FROM plan_detail_products 
    WHERE plan_detail_id = $1 AND is_measured = false AND is_deleted = false;
  `;
  const result = await db.query(checkQuery, [plan_detail_id]);
  const unmeasuredCount = parseInt(result.rows[0].count, 10);

  if (unmeasuredCount === 0) {
    const updateQuery = `
      UPDATE plan_details 
      SET status = 'completed' 
      WHERE id = $1 
      RETURNING id, plan_id, status;
    `;
    const updateResult = await db.query(updateQuery, [plan_detail_id]);
    return updateResult.rows[0]; 
  }
  return null; 
};

const checkAndUpdatePlanStatus = async (plan_id) => {
  const checkQuery = `
    SELECT count(*) 
    FROM plan_details 
    WHERE plan_id = $1 AND status != 'completed';
  `;
  const result = await db.query(checkQuery, [plan_id]);
  const uncompletedCount = parseInt(result.rows[0].count, 10);

  if (uncompletedCount === 0) {
    const updateQuery = `
      UPDATE measurement_plans 
      SET status = 'completed' 
      WHERE id = $1 AND is_deleted = false
      RETURNING *;
    `;
    const updateResult = await db.query(updateQuery, [plan_id]);
    return updateResult.rows[0];
  }
  return null;
};

module.exports = {
  getCustomersByPlan,
  getProductsByPlanDetailId,
  getMeasurementParamsByProductId,
  saveMeasurementValue,
  markProductAsMeasured,
  checkAndUpdateCustomerStatus,
  checkAndUpdatePlanStatus
};