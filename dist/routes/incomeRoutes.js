"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const incomeController_1 = require("../controllers/incomeController");
const router = (0, express_1.Router)();
router.get('/paginate', incomeController_1.getPaginatedIncome);
router.get('/', incomeController_1.getIncomeByUser);
router.get('/:incomeId', incomeController_1.getIncomeById);
router.post('/', incomeController_1.addIncome);
router.put('/', incomeController_1.updateIncome);
router.delete('/:incomeId', incomeController_1.deleteIncome);
exports.default = router;
//# sourceMappingURL=incomeRoutes.js.map