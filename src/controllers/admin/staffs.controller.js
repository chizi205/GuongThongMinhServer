const staffService = require("../../services/admin/staffs.service");
const { ok, badRequest, serverError } = require("../../utils/response");
const xlsx = require("xlsx");
 
const getStaffs = async (req, res) => {
  try {
    const data = await staffService.getStaffs(req.query);
    return ok(res, 200, { data });
  } catch (err) {
    return serverError(res, err.message);
  }
};

const getStaffById = async (req, res) => {
  try {
    const data = await staffService.getStaffById(req.params.id);
    return ok(res, 200, { data });
  } catch (err) {
    return badRequest(res, err.message);
  }
};

const createStaff = async (req, res) => {
  try {
    const data = await staffService.createStaff(req.body);
    return ok(res, 201, { data, message: "Tạo nhân viên thành công" });
  } catch (err) {
    return serverError(res, err.message);
  }
};

const updateStaff = async (req, res) => {
  try {
    const data = await staffService.updateStaff(req.params.id, req.body);
    return ok(res, 200, { data, message: "Cập nhật thành công" });
  } catch (err) {
    return serverError(res, err.message);
  }
};

const deleteStaff = async (req, res) => {
  try {
    await staffService.deleteStaff(req.params.id);
    return ok(res, 200, { message: "Đã xóa nhân viên" });
  } catch (err) {
    return serverError(res, err.message);
  }
};

const lockStaff = async (req, res) => {
  try {
    // FE truyền lên is_active: false để khóa, true để mở
    const data = await staffService.lockStaff(req.params.id, req.body.is_active);
    return ok(res, 200, { data, message: req.body.is_active ? "Đã mở khóa tài khoản" : "Đã khóa tài khoản" });
  } catch (err) {
    return serverError(res, err.message);
  }
};

const resetPassword = async (req, res) => {
  try {
    await staffService.resetPassword(req.params.id, req.body.password);
    return ok(res, 200, { message: "Khôi phục mật khẩu thành công" });
  } catch (err) {
    return serverError(res, err.message);
  }
};

const importStaffsExcel = async (req, res) => {
  try {
    if (!req.file) {
      return badRequest(res, "Vui lòng tải lên file Excel");
    }

    // Đọc buffer của file tải lên
    const workbook = xlsx.read(req.file.buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0]; // Lấy sheet đầu tiên
    const sheet = workbook.Sheets[sheetName];
    
    // Chuyển đổi dữ liệu sheet thành mảng JSON
    const rawData = xlsx.utils.sheet_to_json(sheet);

    // Bạn có thể validate sơ bộ dữ liệu ở đây (vd: check xem có cột username và shop_id không)
    if (rawData.length === 0) {
      return badRequest(res, "File Excel trống");
    }

    const data = await staffService.importStaffs(rawData);
    return ok(res, 201, { data, message: `Import thành công ${data.length} nhân viên` });
    
  } catch (err) {
    // Bắt lỗi Duplicate (trùng username) từ PostgreSQL
    if (err.code === '23505') {
      return serverError(res, "Có username hoặc email bị trùng lặp trong hệ thống");
    }
    return serverError(res, err.message);
  }
};

module.exports = {
  getStaffs,
  getStaffById,
  createStaff,
  updateStaff,
  deleteStaff,
  lockStaff,
  resetPassword,
  importStaffsExcel
};