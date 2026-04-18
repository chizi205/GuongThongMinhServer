const measurementPlanService = require("../../services/shop/measurementPlan.service");

// 1. Tạo mới (Create)
const createPlan = async (req, res) => {
  try {
    const { name, note, status } = req.body; // Không cần lấy shop_id từ body nữa để bảo mật
    
    // SỬA req.user -> req.shop_user
    const shop_id = req.shop_user?.shop_id; 
    const created_by = req.shop_user?.id; 

    if (!shop_id) {
      return res.status(400).json({ success: false, message: "Không lấy được shop_id từ Token." });
    }

    // Gọi Service
    const newPlan = await measurementPlanService.createPlanService({
      shop_id, name, note, status, created_by
    });

    return res.status(201).json({
      success: true,
      message: "Tạo kế hoạch đo thành công!",
      data: newPlan
    });

  } catch (error) {
    console.error("Lỗi Controller createPlan:", error);
    if (error.message.startsWith("BAD_REQUEST")) {
      return res.status(400).json({ success: false, message: error.message.replace("BAD_REQUEST: ", "") });
    }
    return res.status(500).json({ success: false, message: "Đã xảy ra lỗi hệ thống khi tạo kế hoạch đo." });
  }
};

// 2. Lấy danh sách (Read)
const getPlans = async (req, res) => {
  try {
    // SỬA req.user -> req.shop_user
    const shop_id = req.shop_user?.shop_id; 
    
    if (!shop_id) {
      return res.status(400).json({ success: false, message: "Không lấy được shop_id từ Token." });
    }

    const searchKeyword = req.query.search || ""; 
    const plans = await measurementPlanService.getPlansService(shop_id, searchKeyword);

    return res.status(200).json({
      success: true,
      message: "Lấy danh sách kế hoạch đo thành công!",
      data: plans
    });
  } catch (error) {
    console.error("Lỗi Controller getPlans:", error);
    if (error.message.startsWith("BAD_REQUEST")) {
      return res.status(400).json({ success: false, message: error.message.replace("BAD_REQUEST: ", "") });
    }
    return res.status(500).json({ success: false, message: "Đã xảy ra lỗi hệ thống." });
  }
};

// 3. Cập nhật (Update)
const updatePlan = async (req, res) => {
  try {
    const { id } = req.params; 
    // SỬA req.user -> req.shop_user
    const shop_id = req.shop_user?.shop_id; 
    const { name, note, status } = req.body;

    if (!shop_id) {
      return res.status(400).json({ success: false, message: "Không lấy được shop_id từ Token." });
    }

    const updatedPlan = await measurementPlanService.updatePlanService(id, shop_id, { name, note, status });

    return res.status(200).json({
      success: true,
      message: "Cập nhật kế hoạch đo thành công!",
      data: updatedPlan
    });
  } catch (error) {
    console.error("Lỗi Controller updatePlan:", error);
    if (error.message.startsWith("NOT_FOUND")) {
      return res.status(404).json({ success: false, message: error.message.replace("NOT_FOUND: ", "") });
    }
    if (error.message.startsWith("BAD_REQUEST")) {
      return res.status(400).json({ success: false, message: error.message.replace("BAD_REQUEST: ", "") });
    }
    return res.status(500).json({ success: false, message: "Đã xảy ra lỗi hệ thống." });
  }
};

// 4. Xóa (Delete)
const deletePlan = async (req, res) => {
  try {
    const { id } = req.params;
    // SỬA req.user -> req.shop_user
    const shop_id = req.shop_user?.shop_id; 

    if (!shop_id) {
      return res.status(400).json({ success: false, message: "Không lấy được shop_id từ Token." });
    }

    await measurementPlanService.deletePlanService(id, shop_id);

    return res.status(200).json({
      success: true,
      message: "Xóa kế hoạch đo thành công!"
    });
  } catch (error) {
    console.error("Lỗi Controller deletePlan:", error);
    if (error.message.startsWith("NOT_FOUND")) {
      return res.status(404).json({ success: false, message: error.message.replace("NOT_FOUND: ", "") });
    }
    if (error.message.startsWith("BAD_REQUEST")) {
      return res.status(400).json({ success: false, message: error.message.replace("BAD_REQUEST: ", "") });
    }
    return res.status(500).json({ success: false, message: "Đã xảy ra lỗi hệ thống." });
  }
};

module.exports = {
  createPlan,
  getPlans,
  updatePlan,
  deletePlan
};