const service = require("../../services/measurementPlan/planCategorySizeService");

// ==========================================
// CREATE
// ==========================================
const create = async (req, res) => {
  try {
    const { plan_id, category_id } = req.body;

    const data = await service.create({ plan_id, category_id });

    return res.status(201).json({
      success: true,
      data
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
};
// ==========================================
// GET BY PLAN DETAIL
// ==========================================
const getByPlanDetailId = async (req, res) => {
  try {
    const { plan_id } = req.params;

    const data = await service.getByPlanDetailId(plan_id);

    return res.json({
      success: true,
      data
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
// ==========================================
// UPDATE
// ==========================================
const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { category_id } = req.body;

    const data = await service.update(id, { category_id });

    return res.json({
      success: true,
      data
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// ==========================================
// DELETE
// ==========================================
const remove = async (req, res) => {
  try {
    const { id } = req.params;

    const data = await service.remove(id);

    return res.json({
      success: true,
      data
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  create,
  getByPlanDetailId,
  update,
  remove
};