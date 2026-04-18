const planRepo = require("../../repositories/measurementPlan/measurementPlan.repo");

const getPlans = async ({ staff }) => {
  if (!staff || !staff.shop_id) {
    const err = new Error("UNAUTHORIZED");
    err.status = 401;
    throw err;
  }

  const plans = await planRepo.getPlansByShop({
    shop_id: staff.shop_id,
  });

  return plans;
};
const bulkUpdateMeasurementsService = async (planId, dataArray) => {
  if (!dataArray || !Array.isArray(dataArray) || dataArray.length === 0) {
    throw new Error("BAD_REQUEST: Dữ liệu trống.");
  }

  // 1. Lưu thông số đo cho toàn bộ danh sách gửi lên
  await planRepo.upsertUserMeasurementsBulk(dataArray);

  // 2. Cập nhật trạng thái từng khách hàng thành 'done'
  // Dùng Promise.all để đảm bảo tất cả DB UPDATE đã chạy xong
  await Promise.all(
    dataArray.map((item) =>
      planRepo.updatePlanDetailStatus(item.plan_detail_id, "done"),
    ),
  );

  // 3. Sau khi tất cả đã 'done', mới kiểm tra để đóng kế hoạch
  const isPlanFinished = await planRepo.checkAndCompletePlan(planId);

  return {
    success: true,
    isPlanFinished,
    message: isPlanFinished
      ? "Kế hoạch hoàn tất thành công!"
      : "Đã lưu số đo, kế hoạch vẫn đang diễn ra.",
  };
};
const updatePlanDetailNoteService = async (planDetailId, note) => {
  if (!planDetailId) {
    throw new Error("BAD_REQUEST: Thiếu ID chi tiết kế hoạch.");
  }

  const updatedDetail = await planRepo.updatePlanDetailNote(planDetailId, note);

  if (!updatedDetail) {
    throw new Error(
      "NOT_FOUND: Không tìm thấy thông tin khách hàng trong kế hoạch.",
    );
  }

  return updatedDetail;
};
module.exports = {
  getPlans,
  bulkUpdateMeasurementsService,
  updatePlanDetailNoteService,
};
