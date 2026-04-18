const express = require("express");
const router = express.Router();
const staffController = require("../../controllers/admin/staffs.controller");
const auth = require("../../middleware/authAdmin");
// Bảo vệ toàn bộ api bằng auth
router.use(auth);
const multer = require("multer");

// 2. SAU ĐÓ: Mới được phép sử dụng multer để cấu hình biến upload
const upload = multer({ storage: multer.memoryStorage() });
router.get("/", staffController.getStaffs);
router.get("/:id", staffController.getStaffById);
router.post("/", staffController.createStaff);

router.put("/:id", staffController.updateStaff);
router.delete("/:id", staffController.deleteStaff);

// Route dành riêng cho Khóa/Mở khóa và Reset Mật khẩu
router.patch("/:id/lock", staffController.lockStaff);
// Thay PUT bằng PATCH cho giống Frontend
router.put("/:id/reset-password", staffController.resetPassword);

router.post("/import", upload.single('file'), staffController.importStaffsExcel);
module.exports = router;