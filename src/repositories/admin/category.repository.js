const { pool } = require("../../config/database");

// --- CÁC HÀM HELPER CHO SIZE ---

// Lấy danh sách tất cả các Size hiện có trong hệ thống (để hiện lên dropdown)
const getAllSizes = async () => {
    const sql = `SELECT id, name, description FROM sizes ORDER BY name ASC`;
    const { rows } = await pool.query(sql);
    return rows;
};

// Lấy danh sách Size đã gán cho một Danh mục
const getSizesByCategoryId = async (category_id) => {
    const sql = `
        SELECT s.id, s.name 
        FROM sizes s
        JOIN category_sizes cs ON s.id = cs.size_id
        WHERE cs.category_id = $1
    `;
    const { rows } = await pool.query(sql, [category_id]);
    return rows;
};

// Đồng bộ danh sách Size cho Danh mục (Dùng trong Transaction)
const syncCategorySizesWithClient = async (client, category_id, sizeIds) => {
    // 1. Xóa liên kết cũ
    await client.query(`DELETE FROM category_sizes WHERE category_id = $1`, [category_id]);

    // 2. Thêm liên kết mới
    if (sizeIds && sizeIds.length > 0) {
        for (const sizeId of sizeIds) {
            await client.query(
                `INSERT INTO category_sizes (category_id, size_id) VALUES ($1, $2)
                 ON CONFLICT (category_id, size_id) DO NOTHING`,
                [category_id, sizeId]
            );
        }
    }
};

// --- CÁC HÀM CHÍNH ---

const countProductsByCategory = async (categoryId) => {
  const sql = `SELECT COUNT(*) FROM products WHERE category_id = $1 AND is_deleted = false`;
  const result = await pool.query(sql, [categoryId]);
  return parseInt(result.rows[0].count, 10);
};

const getAllCategories = async (search = "") => {
  let sql = `
    SELECT c.*, s.name as shop_name,
           -- Thêm subquery lấy size_ids nếu bạn muốn hiện tag ngay ở bảng ngoài
           (SELECT ARRAY_AGG(size_id) FROM category_sizes WHERE category_id = c.id) as size_ids
    FROM product_categories c
    LEFT JOIN shops s ON c.shop_id = s.id
    WHERE c.is_deleted = false 
  `;
  
  const params = [];
  
  if (search) {
    sql += ` AND c.name ILIKE $1`; // ILIKE giúp tìm kiếm không phân biệt hoa thường
    params.push(`%${search}%`);    // Tìm kiếm dạng chứa chuỗi (contains)
  }

  sql += ` ORDER BY c.created_at DESC`;

  const result = await pool.query(sql, params);
  return result.rows;
};

const getCategoryById = async (id) => {
  const sql = `SELECT * FROM product_categories WHERE id = $1 AND is_deleted = false`;
  const result = await pool.query(sql, [id]);
  const category = result.rows[0];
  
  if (category) {
    // Lấy kèm thông số đo và danh sách size khi xem chi tiết
    category.measurement_params = await getMeasurementParams(id);
    category.size_ids = (await getSizesByCategoryId(id)).map(s => s.id);
  }
  return category;
};

const createCategory = async (data) => {
  const { shop_id, name, slug, measurement_params, size_ids } = data;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // 1. Chèn danh mục (Có xử lý Upsert)
    const sql = `
      INSERT INTO product_categories (shop_id, name, slug, created_at, updated_at)
      VALUES ($1, $2, $3, NOW(), NOW())
      ON CONFLICT (shop_id, slug) 
      DO UPDATE SET 
        name = EXCLUDED.name,
        is_deleted = false,
        is_active = true,
        updated_at = NOW()
      RETURNING *;
    `;
    const result = await client.query(sql, [shop_id, name, slug]);
    const newCategory = result.rows[0];

    // 2. Đồng bộ thông số đo 
    if (measurement_params && Array.isArray(measurement_params)) {
      await syncMeasurementParamsWithClient(client, newCategory.id, measurement_params);
    }

    // 3. Đồng bộ danh sách Size (MỚI BỔ SUNG)
    if (size_ids) {
        await syncCategorySizesWithClient(client, newCategory.id, size_ids);
    }

    // 4. Tự động hiển thị trên Kiosk 
    const insertToKiosks = `
      INSERT INTO kiosk_categories (kiosk_id, category_id, sort_order)
      SELECT id, $1, 0 FROM kiosks WHERE shop_id = $2 AND is_deleted = false
      ON CONFLICT (kiosk_id, category_id) DO NOTHING;
    `;
    await client.query(insertToKiosks, [newCategory.id, shop_id]);
    
    await client.query('COMMIT');
    return newCategory;
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
};

const updateCategory = async (id, data) => {
  const { shop_id, name, slug, is_active, measurement_params, size_ids } = data;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Cập nhật thông tin cơ bản
    const sql = `
      UPDATE product_categories 
      SET 
        shop_id = COALESCE($1, shop_id),
        name = COALESCE($2, name),
        slug = COALESCE($3, slug),
        is_active = COALESCE($4, is_active),
        updated_at = NOW()
      WHERE id = $5 AND is_deleted = false
      RETURNING *;
    `;
    const result = await client.query(sql, [shop_id, name, slug, is_active, id]);
    const updatedCategory = result.rows[0];

    // 2. Đồng bộ thông số đo
    if (measurement_params) {
      await syncMeasurementParamsWithClient(client, id, measurement_params);
    }

    // 3. Đồng bộ danh sách Size (MỚI BỔ SUNG)
    if (size_ids) {
        await syncCategorySizesWithClient(client, id, size_ids);
    }

    await client.query('COMMIT');
    return updatedCategory;
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
};

const deleteCategory = async (id) => {
  const sql = `UPDATE product_categories SET is_deleted = true, updated_at = NOW() WHERE id = $1 RETURNING *`;
  const result = await pool.query(sql, [id]);
  return result.rows[0];
};

const getMeasurementParams = async (category_id) => {
  const query = `SELECT id, category_id, name, code, unit, sort_order FROM category_measurement_params WHERE category_id = $1 ORDER BY sort_order ASC`;
  const { rows } = await pool.query(query, [category_id]);
  return rows;
};

const syncMeasurementParamsWithClient = async (client, category_id, paramsList) => {
  const incomingCodes = paramsList.map(p => p.code);
  
  if (incomingCodes.length > 0) {
    const placeholders = incomingCodes.map((_, i) => `$${i + 2}`).join(',');
    await client.query(`DELETE FROM category_measurement_params WHERE category_id = $1 AND code NOT IN (${placeholders})`, [category_id, ...incomingCodes]);
  } else {
    await client.query(`DELETE FROM category_measurement_params WHERE category_id = $1`, [category_id]);
  }

  for (const param of paramsList) {
    await client.query(`
      INSERT INTO category_measurement_params (category_id, name, code, unit, sort_order)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (category_id, code) 
      DO UPDATE SET name = EXCLUDED.name, unit = EXCLUDED.unit, sort_order = EXCLUDED.sort_order, updated_at = NOW();
    `, [category_id, param.name, param.code, param.unit || 'cm', param.sort_order || 0]);
  }
};

module.exports = {
  getAllCategories, 
  getCategoryById, 
  createCategory, 
  updateCategory, 
  deleteCategory,
  countProductsByCategory, 
  getMeasurementParams,
  getAllSizes, // Export hàm mới
  getSizesByCategoryId // Export hàm mới
};