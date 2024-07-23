"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authController_1 = require("../controllers/authController");
const router = (0, express_1.Router)();
router.post('/register', authController_1.register);
router.post('/login', authController_1.login);
router.get('/verify/:token', authController_1.verifyEmail);
router.post('/password-reset-email', authController_1.passwordResetEmail);
router.post('/reset-password', authController_1.resetPassword);
router.get('/logout', authController_1.logout);
exports.default = router;
//# sourceMappingURL=authRoutes.js.map