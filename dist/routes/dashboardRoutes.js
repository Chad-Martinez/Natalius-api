"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const dashboardController_1 = require("../controllers/dashboardController");
const router = (0, express_1.Router)();
router.get('/upcoming-shifts', dashboardController_1.getUpcomingShifts);
exports.default = router;
//# sourceMappingURL=dashboardRoutes.js.map