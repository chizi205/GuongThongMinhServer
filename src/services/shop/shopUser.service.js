const shopUserRepo = require("../../repositories/shop/shopUser.repo");

const getShopUsersService = async (shop_id, searchKeyword) => {
  if (!shop_id) {
    throw new Error("BAD_REQUEST: Thiếu thông tin Cửa hàng.");
  }

  const users = await shopUserRepo.getShopUsersByShopId(shop_id, searchKeyword);
  return users;
};

module.exports = {
  getShopUsersService
};