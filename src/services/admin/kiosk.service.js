const kioskRepository = require("../../repositories/admin/kiosk.repository");
const bcrypt = require("bcrypt"); // Nhớ npm install bcrypt nếu chưa có

class KioskService {
  async getAllKiosks(query) {
    const limit = parseInt(query.limit) || 10;
    const page = parseInt(query.page) || 1;
    const offset = (page - 1) * limit;

    return await kioskRepository.getAll({
      search: query.search,
      shop_id: query.shop_id,
      status: query.status,
      limit,
      offset
    });
  }

  async getKioskById(id) {
    return await kioskRepository.getById(id);
  }

  async createKiosk(data) {
    // Tạo mật khẩu mặc định là "123456" nếu người dùng không nhập
    const rawPassword = data.password || "123456";
    const password_hash = await bcrypt.hash(rawPassword, 10);
    
    return await kioskRepository.create({ ...data, password_hash });
  }

  async updateKiosk(id, data) {
    // 1. Tạo một bản sao của data để xử lý
    const updatePayload = { ...data };

    // 2. Nếu người dùng CÓ nhập password mới -> Mã hóa nó và gán vào password_hash
    if (updatePayload.password && updatePayload.password.trim() !== "") {
      updatePayload.password_hash = await bcrypt.hash(updatePayload.password, 10);
    }

    // 3. Xóa trường 'password' nguyên bản ra khỏi payload 
    // (để query update SQL không bị lỗi do DB không có cột password)
    delete updatePayload.password;

    // 4. Gọi DB để cập nhật
    return await kioskRepository.update(id, updatePayload);
  }

  async deleteKiosk(id) {
    return await kioskRepository.delete(id);
  }
}

module.exports = new KioskService();