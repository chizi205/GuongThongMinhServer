const db = require("../../config/database");

const CategoryRepo = {
  // ✅ Lấy tất cả category theo shop
  async getByShopId(shopId) {
    const query = `
      SELECT 
        c.id,
        c.name,
        c.created_at
      FROM product_categories c
      WHERE c.shop_id = $1
      ORDER BY c.created_at DESC
    `;

    const result = await db.query(query, [shopId]);
    return result.rows;
  },
  async getSizesByCategoryId(categoryId) {
    const query = `
    SELECT 
      s.id,
      s.name
    FROM category_sizes cs
    JOIN sizes s ON s.id = cs.size_id
    WHERE cs.category_id = $1
  `;

    const result = await db.query(query, [categoryId]);
    return result.rows;
  },
};

module.exports = CategoryRepo;
