const sizeService = require("../../services/measurementPlan/size.service");

const updateCategorySizes = async (req, res, next) => {
  try {
    const { category_id, sizes } = req.body;
    // sizes: [{ size_id: '...', price: 100, stock: 10 }, ...]

    if (!category_id || !sizes) {
      throw new Error("BAD_REQUEST: Thiếu category_id hoặc danh sách sizes.");
    }

    const result = await sizeService.updateCategorySizesService(
      category_id,
      sizes,
    );
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const getProductsByQuickSize = async (req, res, next) => {
  try {
    const { category_id, size_name } = req.query;

    const result = await sizeService.selectProductWithoutMeasurements(
      category_id,
      size_name,
    );
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

module.exports = { updateCategorySizes, getProductsByQuickSize };
