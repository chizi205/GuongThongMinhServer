const productRepo = require("../../repositories/admin/product.repository");

const getProducts = async (filters) => {
  const limit = parseInt(filters.limit) || 10;
  const products = await productRepo.getProductsByCategory({ ...filters, limit: limit + 1 });
  let nextCursor = null;
  if (products.length > limit) {
    products.pop();
    nextCursor = products[products.length - 1].id;
  }
  return { data: products, nextCursor };
};

const createProduct = async (data) => await productRepo.createProduct(data);

const updateProduct = async (id, data) => await productRepo.updateProduct(id, data);

const deleteProduct = async (id) => {
  const variantCount = await productRepo.countVariantsByProductId(id);
  if (variantCount > 0) {
    const error = new Error("PRODUCT_HAS_VARIANTS");
    error.code = "HAS_VARIANTS"; 
    throw error;
  }
  return await productRepo.deleteProduct(id);
};

const createVariant = async (data) => await productRepo.createVariant(data);

const updateVariant = async (id, data) => await productRepo.updateVariant(id, data);

const deleteVariant = async (id) => await productRepo.deleteVariant(id);

module.exports = { getProducts, createProduct, updateProduct, deleteProduct, createVariant, updateVariant, deleteVariant };