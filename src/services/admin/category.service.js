const CategoryRepo = require("../../repositories/admin/category.repository");


const getAllSizes = async () => await CategoryRepo.getAllSizes();
const getAllCategories = async () => await CategoryRepo.getAllCategories();

const createCategory = async (data) => {
  if (!data.name) throw new Error("NAME_REQUIRED");
  return await CategoryRepo.createCategory(data);
};

const updateCategory = async (id, data) => {
  const existing = await CategoryRepo.getCategoryById(id);
  if (!existing) throw new Error("CATEGORY_NOT_FOUND");
  return await CategoryRepo.updateCategory(id, data);
};

const deleteCategory = async (id) => {
  const category = await CategoryRepo.getCategoryById(id);
  if (!category) throw new Error("CATEGORY_NOT_FOUND");
  
  const productCount = await CategoryRepo.countProductsByCategory(id);
  if (productCount > 0) {
    const error = new Error("CATEGORY_HAS_PRODUCTS");
    error.code = "HAS_PRODUCTS";
    throw error;
  }
  return await CategoryRepo.deleteCategory(id);
};

const getMeasurementParams = async (cid) => await CategoryRepo.getMeasurementParams(cid);

const syncMeasurementParams = async (cid, list) => {
  if (!Array.isArray(list)) throw new Error("INVALID_DATA");
  await CategoryRepo.syncMeasurementParams(cid, list);
  return await CategoryRepo.getMeasurementParams(cid);
};

module.exports = {
  getAllCategories, createCategory, updateCategory, deleteCategory,
  getMeasurementParams, syncMeasurementParams, getAllSizes
};