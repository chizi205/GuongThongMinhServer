const planService = require("../../services/measurementPlan/measurementPlan.service");

const getPlans = async (req, res) => {
  try {
    const plans = await planService.getPlans({
      staff: req.staff,
    });

    return res.json({
      success: true,
      data: plans,
    });
  } catch (err) {
    return res.status(err.status || 500).json({
      success: false,
      message: err.message,
    });
  }
};
const bulkUpdateUserMeasurements = async (req, res, next) => {
  try {
    const { id } = req.params; // plan_id
    const { data } = req.body; // Bóc tách mảng data từ: { "data": [...] }

    // Gọi Service với toàn bộ mảng data
    const result = await planService.bulkUpdateMeasurementsService(id, data);

    res.status(200).json({
      success: true,
      message: "Cập nhật dữ liệu thành công",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
const updatePlanDetailNote = async (req, res, next) => {
  try {
    const { plan_detail_id } = req.params; // Lấy ID từ URL
    const { note } = req.body; // Lấy note từ body JSON

    const result = await planService.updatePlanDetailNoteService(
      plan_detail_id,
      note,
    );

    res.status(200).json({
      success: true,
      message: "Cập nhật ghi chú thành công",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
module.exports = {
  getPlans,
  bulkUpdateUserMeasurements,
  updatePlanDetailNote,
};
