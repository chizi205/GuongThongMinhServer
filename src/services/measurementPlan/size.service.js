const sizeRepo = require("../../repositories/measurementPlan/size.repo");

/**
 * Xử lý cập nhật danh sách size cho Category
 */
const updateCategorySizesService = async (category_id, sizesArray) => {
  const results = [];
  for (const item of sizesArray) {
    const updated = await sizeRepo.upsertCategorySize(
      category_id,
      item.size_id,
      item.price,
      item.stock,
    );
    results.push(updated);
  }
  return results;
};

/**
 * Logic: Nếu khách không đo, chọn sản phẩm dựa trên Size mặc định
 */
const selectProductWithoutMeasurements = async (category_id, size_name) => {
  if (!size_name) {
    throw new Error("BAD_REQUEST: Cần chọn một size cụ thể (S, M, L...)");
  }

  // Lấy tất cả biến thể cùng loại và cùng size
  const recommendedVariants = await sizeRepo.getVariantsByGenericSize(
    category_id,
    size_name,
  );

  if (recommendedVariants.length === 0) {
    return {
      message: `Rất tiếc, size ${size_name} hiện đã hết hàng hoặc không tồn tại cho loại đồ này.`,
      data: [],
    };
  }

  return recommendedVariants;
};

module.exports = {
  updateCategorySizesService,
  selectProductWithoutMeasurements,
};
