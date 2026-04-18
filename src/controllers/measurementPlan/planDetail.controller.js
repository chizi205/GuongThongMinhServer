const service = require("../../services/measurementPlan/planDetail.service");

const getCustomers = async (req, res) => {
  try {
    const { plan_id } = req.params;

    const data = await service.getCustomers({
      plan_id,
      staff: req.staff,
    });
    return res.json({
      success: true,
      data,
    });

  } catch (err) {
    return res.status(err.status || 500).json({
      success: false,
      message: err.message,
    });
  }
};

const getProductsByUser = async (req, res) => {
  try {
    const { plan_detail_id } = req.params;

    const data = await service.getUserMeasurementProducts(plan_detail_id);

    return res.status(200).json({
      success: true,
      message: "Lấy danh sách sản phẩm cần đo của khách hàng thành công",
      data
    });
  } catch (error) {
    console.error("Lỗi getProductsByUser:", error);
    if (error.message.startsWith("BAD_REQUEST")) {
      return res.status(400).json({ success: false, message: error.message.replace("BAD_REQUEST: ", "") });
    }
    return res.status(500).json({ success: false, message: "Lỗi khi lấy sản phẩm đo của khách hàng" });
  }
};

const getProductParams = async (req, res) => {
  try {
    const { product_id } = req.params;

    const data = await service.getProductMeasurementParams(product_id);

    return res.status(200).json({
      success: true,
      message: "Lấy danh sách thông số cần đo thành công",
      data
    });
  } catch (error) {
    console.error("Lỗi getProductParams:", error);
    if (error.message.startsWith("BAD_REQUEST")) {
      return res.status(400).json({ success: false, message: error.message.replace("BAD_REQUEST: ", "") });
    }
    return res.status(500).json({ success: false, message: "Lỗi khi lấy thông số đo của sản phẩm" });
  }
};

const saveMeasurements = async (req, res) => {
  try {
    const { plan_detail_id } = req.params;
    
    // Yêu cầu Frontend/App gửi kèm product_id trong body để chốt trạng thái
    const { product_id, measurements } = req.body;

    const data = await service.saveProductMeasurements(plan_detail_id, product_id, measurements);

    return res.status(200).json({
      success: true,
      message: "Lưu số đo thành công!",
      data: data
    });
  } catch (error) {
    console.error("Lỗi saveMeasurements:", error);
    if (error.message.startsWith("BAD_REQUEST")) {
      return res.status(400).json({ success: false, message: error.message.replace("BAD_REQUEST: ", "") });
    }
    return res.status(500).json({ success: false, message: "Lỗi Server khi lưu số đo" });
  }
};

module.exports = {
  getCustomers,
  getProductsByUser,
  getProductParams,
  saveMeasurements
};