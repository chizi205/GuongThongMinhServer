const express = require("express");
const router = express.Router();
const authController = require("../../controllers/shop/auth.controller");

// API: POST /api/shop/auth/login
router.post("/login", authController.login);
router.post("/register", authController.register);

module.exports = router;