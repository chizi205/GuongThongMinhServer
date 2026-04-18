const { pool } = require("../../config/database");

// ==========================================
// 1. QUẢN LÝ SẢN PHẨM (PRODUCTS)
// ==========================================

const getProductsByCategory = async ({ shop_id, category_id, search, limit = 10, cursor = null }) => {
  let queryParams = [limit];
  let whereClause = `WHERE p.is_deleted = false`;
  
  if (shop_id) {
    whereClause += ` AND p.shop_id = $${queryParams.length + 1}`;
    queryParams.push(shop_id);
  }
  if (category_id) {
    whereClause += ` AND p.category_id = $${queryParams.length + 1}`;
    queryParams.push(category_id);
  }
  if (search) {
    whereClause += ` AND p.name ILIKE $${queryParams.length + 1}`;
    queryParams.push(`%${search}%`);
  }
  if (cursor) {
    whereClause += ` AND p.id < $${queryParams.length + 1}`;
    queryParams.push(cursor);
  }

  const sql = `
    SELECT p.*, c.name as category_name
    FROM products p
    LEFT JOIN product_categories c ON p.category_id = c.id
    ${whereClause}
    ORDER BY p.id DESC
    LIMIT $1
  `;

  const result = await pool.query(sql, queryParams);
  const products = result.rows;
  
  if (products.length > 0) {
    const productIds = products.map(p => p.id);
    const variantsResult = await pool.query(`
      SELECT v.*, 
        (SELECT json_agg(json_build_object('param_name', cp.name, 'value', vm.value, 'unit', cp.unit))
         FROM variant_measurements vm
         JOIN category_measurement_params cp ON vm.param_id = cp.id
         WHERE vm.product_variant_id = v.id) as measurements
      FROM product_variants v 
      WHERE v.product_id = ANY($1)
      ORDER BY v.created_at ASC
    `, [productIds]);
      
    products.forEach(p => {
      p.variants = variantsResult.rows.filter(v => v.product_id === p.id);
    });
  }
  return products;
};

const getProductById = async (id) => {
  const sql = `
    SELECT p.*, c.name as category_name
    FROM products p
    LEFT JOIN product_categories c ON p.category_id = c.id
    WHERE p.id = $1 AND p.is_deleted = false
  `;
  const res = await pool.query(sql, [id]);
  const product = res.rows[0];

  if (product) {
    const variantsResult = await pool.query(`
      SELECT v.*, 
        (SELECT json_agg(json_build_object('param_name', cp.name, 'value', vm.value, 'unit', cp.unit))
         FROM variant_measurements vm
         JOIN category_measurement_params cp ON vm.param_id = cp.id
         WHERE vm.product_variant_id = v.id) as measurements
      FROM product_variants v 
      WHERE v.product_id = $1 ORDER BY v.created_at ASC
    `, [id]);
    product.variants = variantsResult.rows;
  }
  return product;
};

const createProduct = async (data) => {
  const { shop_id, category_id, name, description, status, image_url, base_price, slug } = data;
  const sql = `
    INSERT INTO products (
      shop_id, category_id, name, description, status, image_url, base_price, slug, 
      sold_count, view_count, is_deleted, created_at, updated_at
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 0, 0, false, NOW(), NOW())
    ON CONFLICT (slug) 
    DO UPDATE SET 
      shop_id = EXCLUDED.shop_id,
      category_id = EXCLUDED.category_id,
      name = EXCLUDED.name,
      description = EXCLUDED.description,
      status = EXCLUDED.status,
      image_url = EXCLUDED.image_url,
      base_price = EXCLUDED.base_price,
      is_deleted = false,
      deleted_at = NULL,
      updated_at = NOW()
    RETURNING *;
  `; 
  const result = await pool.query(sql, [shop_id, category_id, name, description, status || 'active', image_url, base_price || 0, slug]);
  return result.rows[0];
};

// ĐÃ SỬA: Thêm Upsert cho Variant để đè thông tin nếu Admin nhập trùng SKU
const createVariant = async (data) => {
  const { product_id, sku, size, color, price, stock, model_3d_url, measurements } = data;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const sql = `
      INSERT INTO product_variants 
        (product_id, sku, size, color, price, stock, model_3d_url, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
      ON CONFLICT (sku) 
      DO UPDATE SET 
        product_id = EXCLUDED.product_id,
        size = EXCLUDED.size,
        color = EXCLUDED.color,
        price = EXCLUDED.price,
        stock = EXCLUDED.stock,
        model_3d_url = EXCLUDED.model_3d_url,
        updated_at = NOW()
      RETURNING *;
    `;
    const res = await client.query(sql, [product_id, sku, size, color, price, stock || 0, model_3d_url]);
    const newVariant = res.rows[0];

    if (measurements && Array.isArray(measurements)) {
      // Xóa thông số đo cũ của variant này đi trước khi chèn mới (trường hợp bị trùng SKU và update)
      await client.query(`DELETE FROM variant_measurements WHERE product_variant_id = $1`, [newVariant.id]);
      
      for (const m of measurements) {
        await client.query(
          `INSERT INTO variant_measurements (product_variant_id, param_id, value) VALUES ($1, $2, $3)`,
          [newVariant.id, m.param_id, m.value]
        );
      }
    }
    await client.query('COMMIT');
    return newVariant;
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
};

const updateProduct = async (id, data) => {
  const { category_id, name, description, status, image_url, base_price, slug } = data;
  const sql = `
    UPDATE products 
    SET 
      category_id = COALESCE($1, category_id),
      name = COALESCE($2, name),
      description = COALESCE($3, description),
      status = COALESCE($4, status),
      image_url = COALESCE($5, image_url),
      base_price = COALESCE($6, base_price),
      slug = COALESCE($7, slug),
      updated_at = NOW()
    WHERE id = $8 AND is_deleted = false
    RETURNING *;
  `;
  const result = await pool.query(sql, [category_id, name, description, status, image_url, base_price, slug, id]);
  return result.rows[0];
};

const deleteProduct = async (id) => {
  const sql = `UPDATE products SET is_deleted = true, updated_at = NOW() WHERE id = $1 RETURNING *`;
  const result = await pool.query(sql, [id]);
  return result.rows[0];
};

// ==========================================
// 2. QUẢN LÝ BIẾN THỂ (VARIANTS) + MEASUREMENTS
// ==========================================

const countVariantsByProductId = async (productId) => {
  const sql = `SELECT COUNT(*) FROM product_variants WHERE product_id = $1`;
  const result = await pool.query(sql, [productId]);
  return parseInt(result.rows[0].count, 10);
};



const updateVariant = async (id, data) => {
  const { sku, size, color, price, stock, model_3d_url, measurements } = data;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const sql = `
      UPDATE product_variants 
      SET sku = COALESCE($1, sku), size = COALESCE($2, size), color = COALESCE($3, color),
          price = COALESCE($4, price), stock = COALESCE($5, stock), model_3d_url = COALESCE($6, model_3d_url), updated_at = NOW()
      WHERE id = $7 RETURNING *;
    `;
    const result = await client.query(sql, [sku, size, color, price, stock, model_3d_url, id]);

    if (measurements && Array.isArray(measurements)) {
      await client.query(`DELETE FROM variant_measurements WHERE product_variant_id = $1`, [id]);
      for (const m of measurements) {
        await client.query(
          `INSERT INTO variant_measurements (product_variant_id, param_id, value) VALUES ($1, $2, $3)`,
          [id, m.param_id, m.value]
        );
      }
    }
    await client.query('COMMIT');
    return result.rows[0];
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
};

const deleteVariant = async (id) => {
  const sql = `DELETE FROM product_variants WHERE id = $1 RETURNING *;`;
  const result = await pool.query(sql, [id]);
  return result.rows[0];
};

module.exports = {
  getProductsByCategory, getProductById, createProduct, updateProduct, deleteProduct, countVariantsByProductId, createVariant, updateVariant, deleteVariant
};