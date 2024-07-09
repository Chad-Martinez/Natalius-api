"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const profileController_1 = require("../controllers/profileController");
const router = (0, express_1.Router)();
router.get('/', profileController_1.getUserInfo);
router.put('/', profileController_1.updateUserInfo);
router.put('/auth', profileController_1.updatePassword);
exports.default = router;
//# sourceMappingURL=profileRoutes.js.map