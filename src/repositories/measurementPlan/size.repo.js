const db = require("../../config/database");

/**
 * 1. Cập nhật hoặc thêm mới size cho một Category
 */
const upsertCategorySize = async (category_id, size_id, price, stock) => {
  const query = `
    INSERT INTO category_sizes (category_id, size_id, price, stock)
    VALUES ($1, $2, $3, $4)
    ON CONFLICT (category_id, size_id) 
    DO UPDATE SET 
      price = EXCLUDED.price, 
      stock = EXCLUDED.stock,
      updated_at = NOW()
    RETURNING *;
  `;
  const { rows } = await db.query(query, [category_id, size_id, price, stock]);
  return rows[0];
};

/**
 * 2. Tìm các biến thể sản phẩm dựa trên tên Size (S, M, L...)
 * Dùng khi khách không có số đo cụ thể
 */
const getVariantsByGenericSize = async (category_id, size_name) => {
  const query = `
    SELECT 
      p.id AS product_id, p.name AS product_name, 
      pv.id AS variant_id, pv.sku, pv.price, pv.size, pv.stock
    FROM products p
    JOIN product_variants pv ON p.id = pv.product_id
    WHERE p.category_id = $1 
      AND pv.size ILIKE $2 -- So khớp với tên size (ví dụ: 'XL')
      AND p.is_deleted = false
      AND pv.stock > 0;
  `;
  const { rows } = await db.query(query, [category_id, size_name]);
  return rows;
};

module.exports = { upsertCategorySize, getVariantsByGenericSize };
