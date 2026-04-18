const CategoryService = require("../../services/admin/category.service");


// MỚI: Lấy danh sách tất cả các size hiện có trong hệ thống
exports.getAllSizes = async (req, res) => {
  try {
    const data = await CategoryService.getAllSizes();
    res.status(200).json({ success: true, data });
  } catch (e) {
    res.status(500).json({ success: false, message: "Lỗi tải danh sách size" });
  }
};

exports.getCategories = async (req, res) => {
  try {
    const data = await CategoryService.getAllCategories();
    res.status(200).json({ success: true, data });
  } catch (e) {
    res.status(500).json({ success: false, message: "Lỗi tải danh mục" });
  }
};

exports.createCategory = async (req, res) => {
  try {
    // ĐÃ CẬP NHẬT: Nhận thêm size_ids từ body
    const { shop_id, name, slug, measurement_params, size_ids } = req.body;
    
    if (!name || !shop_id) {
      return res.status(400).json({ success: false, message: "Thiếu tên hoặc Shop ID" });
    }

    const data = await CategoryService.createCategory({ 
      shop_id, 
      name, 
      slug, 
      measurement_params,
      size_ids // Gửi kèm danh sách size được chọn
    });

    res.status(201).json({ success: true, data, message: "Tạo danh mục thành công" });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message || "Lỗi tạo danh mục" });
  }
};

exports.updateCategory = async (req, res) => {
  try {
    // Backend Service sẽ nhận toàn bộ body (bao gồm size_ids nếu có)
    const data = await CategoryService.updateCategory(req.params.id, req.body);
    res.status(200).json({ success: true, data, message: "Cập nhật thành công" });
  } catch (e) {
    const status = e.message === "CATEGORY_NOT_FOUND" ? 404 : 500;
    res.status(status).json({ success: false, message: e.message });
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    await CategoryService.deleteCategory(req.params.id);
    res.status(200).json({ success: true, message: "Xóa thành công" });
  } catch (e) {
    if (e.message === "CATEGORY_NOT_FOUND") return res.status(404).json({ success: false, message: "Không tìm thấy" });
    if (e.code === "HAS_PRODUCTS") return res.status(400).json({ success: false, message: "Danh mục đang có sản phẩm, không thể xóa" });
    res.status(500).json({ success: false, message: "Lỗi hệ thống" });
  }
};

// ... (giữ nguyên các hàm getParams và syncParams bên dưới)

exports.getParams = async (req, res) => {
  try {
    const data = await CategoryService.getMeasurementParams(req.params.id);
    res.status(200).json({ success: true, data });
  } catch (e) {
    res.status(500).json({ success: false, message: "Lỗi lấy thông số" });
  }
};

exports.syncParams = async (req, res) => {
  try {
    const data = await CategoryService.syncMeasurementParams(req.params.id, req.body.paramsList);
    res.status(200).json({ success: true, data, message: "Cập nhật thông số thành công" });
  } catch (e) {
    res.status(500).json({ success: false, message: "Lỗi cập nhật thông số" });
  }
};