const staffRepo = require("../../repositories/admin/staffs.repo");
const bcrypt = require("bcryptjs");

const getStaffs = async (query) => {
  return await staffRepo.getStaffs(query);
};

const getStaffById = async (id) => {
  const staff = await staffRepo.getStaffById(id);
  if (!staff) throw new Error("Không tìm thấy nhân viên");
  return staff;
};

const createStaff = async (body) => {
  // Mã hóa mật khẩu trước khi tạo
  const salt = await bcrypt.genSalt(10);
  body.password_hash = await bcrypt.hash(body.password, salt);
  return await staffRepo.createStaff(body);
};

const updateStaff = async (id, body) => {
  return await staffRepo.updateStaff(id, body);
};

const deleteStaff = async (id) => {
  return await staffRepo.deleteStaff(id);
};

const lockStaff = async (id, is_active) => {
  return await staffRepo.lockStaff(id, is_active);
};

const resetPassword = async (id, newPassword) => {
  // Băm mật khẩu mới
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(newPassword, salt);
  return await staffRepo.resetPassword(id, hash);
};

const importStaffs = async (staffsData) => {
  if (!staffsData || staffsData.length === 0) {
    throw new Error("File Excel không có dữ liệu");
  }

  const salt = await bcrypt.genSalt(10);
  const defaultPassword = "123456"; // Mật khẩu mặc định cho tất cả nhân viên import

  const preparedStaffs = [];
  for (const item of staffsData) {
    // Hash mật khẩu
    const password_hash = await bcrypt.hash(defaultPassword, salt);
    
    // Đẩy dữ liệu đã chuẩn bị vào mảng
    preparedStaffs.push({
      shop_id: item.shop_id,
      username: item.username,
      password_hash: password_hash,
      role: item.role || 'staff', // Nếu excel không có cột role thì mặc định là staff
      email: item.email || null,
      phone: item.phone || null
    });
  }

  return await staffRepo.createMultipleStaffs(preparedStaffs);
};

module.exports = {
  getStaffs,
  getStaffById,
  createStaff,
  updateStaff,
  deleteStaff,
  lockStaff,
  resetPassword,
  importStaffs
};