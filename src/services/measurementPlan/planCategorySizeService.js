const repo = require("../../repositories/measurementPlan/planCategorySizeRepo");

const create = async ({ plan_id, category_id }) => {
  const exists = await repo.checkExists(plan_id, category_id);
  if (exists) {
    throw new Error("Category size already exists in this plan");
  }

  return await repo.createPlanCategorySize(plan_id, category_id);
};

const getByPlanDetailId = async (plan_id) => {
  return await repo.getByPlanDetailId(plan_id);
};

const update = async (id, { category_id }) => {
  const updated = await repo.updatePlanCategorySize(id, category_id);

  if (!updated) {
    throw new Error("Plan category size not found");
  }

  return updated;
};

const remove = async (id) => {
  const deleted = await repo.deletePlanCategorySize(id);

  if (!deleted) {
    throw new Error("Plan category size not found");
  }

  return deleted;
};

module.exports = {
  create,
  getByPlanDetailId,
  update,
  remove
};