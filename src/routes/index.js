const express = require("express");
const router = express.Router();

router.use("/admin/auth", require("./admin/auth.routes"));
router.use("/admin/shops", require("./admin/shops.routes"));
router.use("/admin/kiosks", require("./admin/kiosks.routes"));
router.use("/admin/customers", require("./admin/customer.routes"));
router.use("/admin/products", require("./admin/product.routes"));
router.use("/admin/categories", require("./admin/category.routes"));
router.use("/admin/marketing/send-tryon", require("./admin/sendMarketingTryOn.routes"));
router.use("/admin/dashboard", require("./admin/dashboard.routes"));
router.use("/admin/kiosks", require("./admin/kiosks.routes"));
router.use("/admin/account", require("./admin/account.routes"));
router.use("/admin/orders", require("./admin/order.routes"));
router.use('/admin/staffs', require('./admin/staffs.routes'));//
router.use('/admin/measurement-plan', require('./admin/measurementPlan.routes'));


router.use("/shop/products", require("./shop/products.routes"));
router.use("/shop/categories", require("./shop/categories.routes"));// api/shop/categories
router.use("/shop/kiosks", require("./shop/kiosk.routes"));
router.use("/shop/staffs", require("./shop/staff.routes"));
router.use("/shop/auth", require("./shop/auth.routes"));
router.use("/shop/account", require("./shop/account.routes"));
router.use("/shop/active-shops", require("./shop/shop.routes"));
router.use("/shop/measurement-plan", require("./shop/measurementPlan.routes"));
router.use("/shop/users", require("./shop/shopUser.routes"));


router.use("/kiosk/auth", require("./kiosk/auth.routes"));
router.use("/kiosk", require("./kiosk/catalog.routes"));
router.use("/kiosk", require("./kiosk/tryon.routes"));
router.use("/kiosk", require("./kiosk/session.routes"));
router.use("/kiosk", require("./kiosk/cart.routes"));

router.use("/orders", require("./order/order.routes"));
router.use("/customers", require("./customer/customer.routes"));
router.use("/advertise", require("./advertise/advertise.routes"));

router.use("/staff/auth", require("./staff/auth.routes"));

router.use("/plans", require("./measurementPlan/measurementPlan.route"));
router.use("/plans", require("./measurementPlan/planDetail.route"));
router.use("/plan-category-sizes", require("./measurementPlan/planCategorySize.route"));

router.use("/user/auth", require("./user/auth.routes"));
router.use("/user/info", require("./user/info.route"));
router.use("/user/send", require("./user/send.routes"));

router.use("/album", require("./album/album.routes"));

router.use("/webhook",require("./webhooks/zalooa.routes"));
router.use("/webhook",require("./webhooks/payos.routes"));

module.exports = router;
