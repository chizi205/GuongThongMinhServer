const db = require("../../config/database");

// lấy danh sách kế hoạch theo shop
const getPlansByShop = async ({ shop_id }) => {
  const result = await db.query(
    `
    SELECT 
      mp.id,
      mp.name,
      mp.note,
      mp.status,
      mp.created_at,
      s.username AS created_by_name,
      is_synced
    FROM measurement_plans mp
    LEFT JOIN shop_staffs s ON mp.created_by = s.id
    WHERE mp.shop_id = $1
      AND mp.is_deleted = FALSE
    ORDER BY mp.created_at DESC
    `,
    [shop_id],
  );

  return result.rows;
};
const upsertUserMeasurementsBulk = async (payload) => {
  try {
    // Vì db.connect() bị lỗi, ta dùng db.query trực tiếp
    // Lưu ý: Cách này không có Transaction (BEGIN/COMMIT),
    // nhưng sẽ chạy được với config database hiện tại của bạn.

    for (const item of payload) {
      const { plan_detail_id, measurements } = item;

      for (const m of measurements) {
        // LOGIC CŨ CỦA LẬP: Tách lấy UUID thực sự sau dấu "_"
        const realParamId = m.param_id.includes("_")
          ? m.param_id.split("_").pop()
          : m.param_id;

        const query = `
          INSERT INTO plan_detail_measurements (plan_detail_id, param_id, measured_value, updated_at)
          VALUES ($1, $2, $3, NOW())
          ON CONFLICT (plan_detail_id, param_id) 
          DO UPDATE SET 
            measured_value = EXCLUDED.measured_value,
            updated_at = NOW();
        `;

        // Gọi trực tiếp db.query thay vì client.query
        await db.query(query, [plan_detail_id, realParamId, m.value]);
      }
    }

    return true;
  } catch (error) {
    console.error("Repo Error:", error);
    throw error;
  }
};
const getVariantIdsByPlanId = async (planId) => {
  const query = `
    SELECT pv.id
    FROM plan_detail_products pdp
    JOIN plan_details pd ON pdp.plan_detail_id = pd.id
    JOIN product_variants pv ON pdp.product_id = pv.product_id
    WHERE pd.plan_id = $1 AND pdp.is_deleted = false;
  `;
  const { rows } = await db.query(query, [planId]);
  return rows.map((r) => r.id);
};
const updatePlanDetailStatus = async (planDetailId, status = "done") => {
  const query = `
    UPDATE plan_details 
    SET status = $1, updated_at = NOW() 
    WHERE id = $2;
  `;
  // Sử dụng db.query trực tiếp theo config hiện tại của bạn
  await db.query(query, [status, planDetailId]);
};
/**
 * Kiểm tra xem tất cả khách hàng trong kế hoạch đã đo xong chưa
 */
const checkAndCompletePlan = async (planId) => {
  // 1. Đếm số lượng khách hàng CHƯA hoàn thành ('done')
  const checkQuery = `
    SELECT COUNT(*) 
    FROM plan_details 
    WHERE plan_id = $1 AND status != 'done';
  `;
  const { rows } = await db.query(checkQuery, [planId]);

  // Chuyển về số nguyên để so sánh chính xác
  const remainingCount = parseInt(rows[0].count, 10);

  console.log(
    `[DEBUG] Kế hoạch ${planId}: Còn ${remainingCount} người chưa hoàn tất.`,
  );

  // 2. Chỉ cập nhật khi không còn ai chưa đo
  if (remainingCount === 0) {
    const updatePlanQuery = `
      UPDATE measurement_plans 
      SET status = 'completed', updated_at = NOW() 
      WHERE id = $1;
    `;
    await db.query(updatePlanQuery, [planId]);
    console.log(
      `[DEBUG] Đã tự động chuyển trạng thái kế hoạch sang 'completed'`,
    );
    return true;
  }
  return false;
};
const updatePlanDetailNote = async (planDetailId, note) => {
  const query = `
    UPDATE plan_details 
    SET note = $1, updated_at = NOW() 
    WHERE id = $2
    RETURNING *;
  `;
  const { rows } = await db.query(query, [note, planDetailId]);
  return rows[0];
};
module.exports = {
  getPlansByShop,
  upsertUserMeasurementsBulk,
  getVariantIdsByPlanId,
  updatePlanDetailStatus,
  checkAndCompletePlan,
  updatePlanDetailNote,
};
