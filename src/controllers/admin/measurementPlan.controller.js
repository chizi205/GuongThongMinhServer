const measurementPlanService = require("../../services/admin/measurementPlan.service");

const createPlan = async (req, res, next) => {
  try {
    // ĐÃ SỬA: Gán created_by chính bằng staff_id do Frontend truyền lên
    const data = { ...req.body, created_by: req.body.staff_id }; 
    
    const result = await measurementPlanService.createPlanService(data);
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const getPlans = async (req, res, next) => {
  try {
    const { shop_id, keyword } = req.query;
    console.log(req.query)
    const result = await measurementPlanService.getPlansService(shop_id, keyword);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const updatePlan = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await measurementPlanService.updatePlanService(id, req.body);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const deletePlan = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await measurementPlanService.deletePlanService(id);
    res.status(200).json({ success: true, message: "Xóa kế hoạch thành công", data: result });
  } catch (error) {
    next(error);
  }
};

const exportExcel = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Gọi service để lấy Buffer dữ liệu Excel
    const buffer = await measurementPlanService.exportExcelService(id);
    
    // Thiết lập các Header cho file Excel
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=KeHoachDo_${id}.xlsx`
    );

    // Gửi trực tiếp Buffer về client
    res.status(200).send(buffer);
    
  } catch (error) {
    // Chuyển lỗi sang middleware xử lý lỗi tập trung
    next(error);
  }
};

module.exports = { createPlan, getPlans, updatePlan, deletePlan, exportExcel };