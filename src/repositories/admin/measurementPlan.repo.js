const db = require("../../config/database");

const createMeasurementPlan = async (planData) => {
  const { shop_id, created_by, name, note, status } = planData;
  
  const query = `
    INSERT INTO measurement_plans (shop_id, created_by, name, note, status)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING id, shop_id, created_by AS staff_id, name, note, status, created_at;
  `;
  
  // ĐÃ SỬA: Truyền created_by vào mảng values
  const { rows } = await db.query(query, [shop_id, created_by, name, note, status]);
  return rows[0];
};

const getPlans = async (shop_id, searchKeyword) => {
  let query = `
    SELECT 
      mp.id, mp.shop_id, mp.name, mp.note, mp.status, mp.created_at, mp.updated_at,
      mp.created_by AS staff_id, -- Đổi tên thành staff_id để Form Frontend nhận diện được khi bấm Sửa
      s.name AS shop_name,
      st.username AS staff_name
    FROM measurement_plans mp
    LEFT JOIN shops s ON mp.shop_id = s.id
    LEFT JOIN shop_staffs st ON mp.created_by = st.id -- JOIN bằng cột created_by
    WHERE mp.is_deleted = false
  `;
  const values = [];
  
  if (shop_id) {
    values.push(shop_id);
    query += ` AND mp.shop_id = $${values.length}`;
  }
  if (searchKeyword) {
    values.push(`%${searchKeyword}%`);
    query += ` AND mp.name ILIKE $${values.length}`;
  }
  query += ` ORDER BY mp.created_at DESC;`;

  const { rows } = await db.query(query, values);
  return rows;
};

const updatePlan = async (id, updateData) => {
  const { shop_id, staff_id, name, note, status } = updateData;
  const query = `
    UPDATE measurement_plans
    SET 
      shop_id = COALESCE($1, shop_id),
      created_by = COALESCE($2, created_by), -- Cập nhật cột created_by bằng staff_id mới
      name = COALESCE($3, name), 
      note = COALESCE($4, note), 
      status = COALESCE($5, status), 
      updated_at = NOW()
    WHERE id = $6 AND is_deleted = false
    RETURNING id, shop_id, created_by AS staff_id, name, note, status, updated_at;
  `;
  const { rows } = await db.query(query, [shop_id, staff_id, name, note, status, id]);
  return rows[0];
};

const deletePlan = async (id) => {
  const query = `
    UPDATE measurement_plans
    SET is_deleted = true, updated_at = NOW()
    WHERE id = $1 AND is_deleted = false
    RETURNING id;
  `;
  const { rows } = await db.query(query, [id]);
  return rows[0];
};



const getPlanDataForExport = async (planId) => {
  const query = `
    SELECT 
      pd.id AS plan_detail_id,
      u.full_name,
      u.gender,
      -- Pivot thông số từ DB (Đã bổ sung đầy đủ các trường mới và tương thích mã code)
      MAX(CASE WHEN cmp.code IN ('rong_vai', 'vai') THEN pdm.measured_value END) as m_vai,
      MAX(CASE WHEN cmp.code = 'dai_tay' THEN pdm.measured_value END) as m_dai_tay,
      MAX(CASE WHEN cmp.code = 'dai_ao' THEN pdm.measured_value END) as m_dai_ao,
      MAX(CASE WHEN cmp.code = 'vong_nguc' THEN pdm.measured_value END) as m_vong_nguc,
      MAX(CASE WHEN cmp.code = 'vong_eo' THEN pdm.measured_value END) as m_vong_eo,
      MAX(CASE WHEN cmp.code = 'vong_mong' THEN pdm.measured_value END) as m_vong_mong,
      MAX(CASE WHEN cmp.code IN ('vong_co', 'co') THEN pdm.measured_value END) as m_co,
      MAX(CASE WHEN cmp.code = 'bap_tay' THEN pdm.measured_value END) as m_bap_tay,
      MAX(CASE WHEN cmp.code = 'ngang' THEN pdm.measured_value END) as m_ngang,
      MAX(CASE WHEN cmp.code = 'nach' THEN pdm.measured_value END) as m_nach,
      
      MAX(CASE WHEN cmp.code IN ('vong_eo_quan', 'lung_quan') OR (pc.slug = 'quan-tay' AND cmp.code = 'vong_eo') THEN pdm.measured_value END) as m_lung_quan,
      MAX(CASE WHEN cmp.code = 'dai_quan' THEN pdm.measured_value END) as m_dai_quan,
      MAX(CASE WHEN cmp.code = 'day' THEN pdm.measured_value END) as m_day,
      MAX(CASE WHEN cmp.code = 'dui' THEN pdm.measured_value END) as m_dui,
      MAX(CASE WHEN cmp.code = 'ong' THEN pdm.measured_value END) as m_ong,
      MAX(CASE WHEN cmp.code = 'ly' THEN pdm.measured_value END) as m_ly,
      
      -- Gộp Tên Sản Phẩm và Size thành chuỗi để xử lý cột động trên server
      STRING_AGG(DISTINCT p.name || '::' || COALESCE(s.name, ''), '||') as products_data,
      
      pd.note
    FROM plan_details pd
    JOIN users u ON pd.user_id = u.id
    LEFT JOIN plan_detail_measurements pdm ON pd.id = pdm.plan_detail_id
    LEFT JOIN category_measurement_params cmp ON pdm.param_id = cmp.id
    LEFT JOIN plan_detail_products pdp ON pd.id = pdp.plan_detail_id
    LEFT JOIN products p ON pdp.product_id = p.id
    LEFT JOIN product_categories pc ON p.category_id = pc.id
    LEFT JOIN category_sizes cs ON pc.id = cs.category_id
    LEFT JOIN sizes s ON cs.size_id = s.id
    WHERE pd.plan_id = $1 AND pd.is_deleted = false
    GROUP BY pd.id, u.full_name, u.gender, pd.note
    ORDER BY u.full_name ASC;
  `;
  const { rows } = await db.query(query, [planId]);

  const shopQuery = `
    SELECT s.name as shop_name FROM measurement_plans mp 
    JOIN shops s ON mp.shop_id = s.id WHERE mp.id = $1
  `;
  const shopRes = await db.query(shopQuery, [planId]);

  return { shopName: shopRes.rows[0]?.shop_name || "", details: rows };
}

module.exports = { createMeasurementPlan, getPlans, updatePlan, deletePlan, getPlanDataForExport };