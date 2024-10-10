"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const incomeController_1 = require("../controllers/incomeController");
const router = (0, express_1.Router)();
router.get('/paginate', incomeController_1.getPaginatedIncome);
router.get('/dashboard', incomeController_1.getIncomeDashboardData);
exports.default = router;
//# sourceMappingURL=incomeRoutes.js.map