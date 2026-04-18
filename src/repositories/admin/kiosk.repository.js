const pool = require("../../config/database");

class KioskRepository {
  // 1. LẤY DANH SÁCH (Đã thêm điều kiện: is_deleted = false)
  async getAll({ search, shop_id, status, limit = 10, offset = 0 }) {
    let query = `
      SELECT 
        k.id, 
        UPPER(SUBSTRING(k.id::text, 1, 8)) as code, 
        k.name, 
        k.location, 
        k.status, 
        k.shop_id,
        s.name as shop_name,
        ka.username, -- [MỚI THÊM] Lấy thêm username để Frontend hiển thị
        COALESCE(ka.is_active, false) as account_active,
        k.last_active,
        (k.last_active > NOW() - INTERVAL '5 minutes') as is_online
      FROM kiosks k
      LEFT JOIN kiosk_accounts ka ON k.id = ka.kiosk_id
      LEFT JOIN shops s ON k.shop_id = s.id
      WHERE k.is_deleted = false
    `;
    const values = [];
    let count = 1;

    // Tìm kiếm
    if (search) {
      query += ` AND (k.name ILIKE $${count} OR UPPER(SUBSTRING(k.id::text, 1, 8)) ILIKE $${count})`;
      values.push(`%${search}%`);
      count++;
    }

    // Lọc theo Cửa hàng
    if (shop_id) {
      query += ` AND k.shop_id = $${count}`;
      values.push(shop_id);
      count++;
    }

    // Lọc theo Trạng thái
    if (status) {
      query += ` AND k.status = $${count}`;
      values.push(status);
      count++;
    }

    // Đếm tổng
    const countQuery = `SELECT COUNT(*) FROM (${query}) as total`;
    const totalResult = await pool.query(countQuery, values);
    const total = parseInt(totalResult.rows[0].count);

    // Phân trang
    query += ` ORDER BY k.created_at DESC LIMIT $${count} OFFSET $${count + 1}`;
    values.push(limit, offset);

    const result = await pool.query(query, values);

    return { 
      items: result.rows, 
      total,
      summary: {
        total: total,
        online: result.rows.filter(k => k.is_online).length,
        offline: result.rows.filter(k => !k.is_online).length
      }
    };
  }

  // 2. LẤY CHI TIẾT 1 KIOSK (Chỉ lấy khi chưa xóa)
  async getById(id) {
    const query = `
      SELECT 
        k.*, 
        UPPER(SUBSTRING(k.id::text, 1, 8)) as code,
        COALESCE(ka.is_active, false) as account_active,
        s.name as shop_name
      FROM kiosks k
      LEFT JOIN kiosk_accounts ka ON k.id = ka.kiosk_id
      LEFT JOIN shops s ON k.shop_id = s.id
      WHERE k.id = $1 AND k.is_deleted = false
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }


  // 3. THÊM MỚI KIOSK
  // 3. THÊM MỚI KIOSK
  async create(data) {
    const { name, location, shop_id, status = 'active', username, password_hash } = data;
    try {
      await pool.query('BEGIN');
      
      // 1. Tạo Kiosk (Không lỗi vì bảng kiosks không cấm trùng tên)
      const insertKiosk = `
        INSERT INTO kiosks (name, location, shop_id, status) 
        VALUES ($1, $2, $3, $4) RETURNING *;
      `;
      const kioskRes = await pool.query(insertKiosk, [name, location, shop_id, status]);
      const newKiosk = kioskRes.rows[0];

      // 2. Tạo tài khoản đăng nhập (ĐÃ SỬA: Dùng Upsert để đè tài khoản cũ nếu bị trùng username)
      const insertAccount = `
        INSERT INTO kiosk_accounts (kiosk_id, shop_id, username, password_hash, is_active) 
        VALUES ($1, $2, $3, $4, true)
        ON CONFLICT (shop_id, username) 
        DO UPDATE SET 
          kiosk_id = EXCLUDED.kiosk_id, -- Trỏ tài khoản cũ sang Kiosk mới
          password_hash = EXCLUDED.password_hash,
          is_active = true,
          updated_at = NOW()
      `;
      await pool.query(insertAccount, [newKiosk.id, shop_id, username, password_hash || '']); 

      // 3. Tự động gán tất cả Danh mục hiện có của Shop vào Kiosk mới này
      // ĐÃ SỬA: Thêm điều kiện is_deleted = false để không gán nhầm danh mục rác
      const insertKioskCategories = `
        INSERT INTO kiosk_categories (kiosk_id, category_id, sort_order)
        SELECT $1, id, 0 FROM product_categories 
        WHERE shop_id = $2 AND is_deleted = false
      `;
      await pool.query(insertKioskCategories, [newKiosk.id, shop_id]);

      await pool.query('COMMIT');
      return newKiosk;
    } catch (error) {
      await pool.query('ROLLBACK');
      throw error;
    }
  }


  // 4. CẬP NHẬT KIOSK & TÀI KHOẢN (Cho phép cập nhật cả username)
  async update(id, data) {
    // Lưu ý: Nếu user không truyền lên trường nào, ta dùng COALESCE để giữ nguyên giá trị cũ trong DB
    const { name, location, shop_id, status, username, password_hash, account_active } = data;
    
    try {
      await pool.query('BEGIN');
      
      // 1. Cập nhật thông tin cơ bản của Kiosk
      const updateKioskQuery = `
        UPDATE kiosks 
        SET 
          name = COALESCE($1, name), 
          location = COALESCE($2, location), 
          shop_id = COALESCE($3, shop_id), 
          status = COALESCE($4, status),
          updated_at = NOW()
        WHERE id = $5 AND is_deleted = false
        RETURNING *;
      `;
      const kioskRes = await pool.query(updateKioskQuery, [name, location, shop_id, status, id]);
      
      if (kioskRes.rowCount === 0) {
        throw new Error("Kiosk không tồn tại hoặc đã bị xóa!");
      }

      // 2. Cập nhật tài khoản Kiosk (Cập nhật Username, Mật khẩu, Trạng thái truy cập)
      const updateAccountQuery = `
        UPDATE kiosk_accounts 
        SET 
          username = COALESCE($1, username),
          is_active = COALESCE($2, is_active),
          password_hash = COALESCE($3, password_hash),
          updated_at = NOW()
        WHERE kiosk_id = $4
      `;
      
      // Do account_active là boolean (true/false), nên cần check undefined rõ ràng
      const isActiveValue = account_active !== undefined ? account_active : null;

      await pool.query(updateAccountQuery, [username, isActiveValue, password_hash, id]);

      await pool.query('COMMIT');
      return kioskRes.rows[0];
    } catch (error) {
      await pool.query('ROLLBACK');
      throw error;
    }
  }

  // 5. XÓA MỀM KIOSK (SOFT DELETE)
  async delete(id) {
    try {
      await pool.query('BEGIN');
      
      // Đánh dấu là đã xóa thay vì xóa cứng
      const query = `
        UPDATE kiosks 
        SET is_deleted = true, deleted_at = NOW() 
        WHERE id = $1 RETURNING id;
      `;
      const result = await pool.query(query, [id]);
      
      // Đồng thời khóa tài khoản Kiosk để thiết bị bị đẩy ra ngoài
      await pool.query(
        "UPDATE kiosk_accounts SET is_active = false, updated_at = NOW() WHERE kiosk_id = $1", 
        [id]
      );

      await pool.query('COMMIT');
      return result.rowCount > 0;
    } catch (error) {
      await pool.query('ROLLBACK');
      throw error;
    }
  }
}

module.exports = new KioskRepository();