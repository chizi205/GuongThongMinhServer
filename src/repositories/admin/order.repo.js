const { pool } = require("../../config/database");

const getAllOrders = async ({ status, payment_status, startDate, endDate, keyword, shop_id, limit, offset }) => {
  let query = `
    SELECT DISTINCT o.*, u.full_name as customer_name
    FROM orders o
    LEFT JOIN users u ON o.user_id = u.id
    LEFT JOIN order_items oi ON o.id = oi.order_id
    LEFT JOIN product_variants pv ON oi.product_variant_id = pv.id
    LEFT JOIN products p ON pv.product_id = p.id
    WHERE 1=1
  `;
  const params = [];

  // 1. Lọc theo Shop (Quan trọng nhất)
  if (shop_id) {
    params.push(shop_id);
    query += ` AND p.shop_id = $${params.length}`;
  }

  // 2. Lọc theo trạng thái đơn hàng
  if (status) {
    params.push(status);
    query += ` AND o.status = $${params.length}`;
  }

  // 3. Lọc theo trạng thái thanh toán
  if (payment_status) {
    params.push(payment_status);
    query += ` AND o.payment_status = $${params.length}`;
  }

  // 4. Lọc theo khoảng ngày 
  if (startDate && endDate) {
    params.push(startDate, endDate);
    query += ` AND o.created_at BETWEEN $${params.length - 1} AND $${params.length}`;
  }

  // 5. Tìm kiếm theo tên khách hàng
  if (keyword) {
    params.push(`%${keyword}%`);
    query += ` AND u.full_name ILIKE $${params.length}`;
  }

  // Sắp xếp và phân trang
  query += ` ORDER BY o.created_at DESC LIMIT ${limit || 10} OFFSET ${offset || 0}`;
  
  const res = await pool.query(query, params);
  return res.rows;
};

// Hàm thống kê doanh thu theo Shop
const getRevenueStats = async (shop_id) => {
  let query = `
    SELECT SUM(DISTINCT o.total_amount) as total_revenue 
    FROM orders o
    LEFT JOIN order_items oi ON o.id = oi.order_id
    LEFT JOIN product_variants pv ON oi.product_variant_id = pv.id
    LEFT JOIN products p ON pv.product_id = p.id
    WHERE o.payment_status = 'paid'
  `;
  const params = [];

  if (shop_id) {
    params.push(shop_id);
    query += ` AND p.shop_id = $1`;
  }

  const res = await pool.query(query, params);
  return res.rows[0] || { total_revenue: 0 };
};

const getOrderDetail = async (orderId) => {
  const order = await pool.query(
    `SELECT o.*, u.full_name as customer_name 
     FROM orders o 
     LEFT JOIN users u ON o.user_id = u.id 
     WHERE o.id = $1`, 
    [orderId]
  );
  
  const items = await pool.query(
    `SELECT oi.*, p.name as product_name, p.shop_id 
     FROM order_items oi 
     JOIN product_variants pv ON oi.product_variant_id = pv.id
     JOIN products p ON pv.product_id = p.id
     WHERE oi.order_id = $1`, 
    [orderId]
  );
  
  return { ...order.rows[0], items: items.rows };
};

const updateOrder = async (id, data) => {
  const { status, payment_status } = data;
  const query = `
    UPDATE orders 
    SET status = COALESCE($1, status), 
        payment_status = COALESCE($2, payment_status), 
        updated_at = NOW() 
    WHERE id = $3 RETURNING *`;
  const res = await pool.query(query, [status, payment_status, id]);
  return res.rows[0];
};

module.exports = { getAllOrders, getRevenueStats, updateOrder, getOrderDetail };