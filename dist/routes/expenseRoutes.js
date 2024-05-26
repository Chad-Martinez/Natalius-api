"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const expenseController_1 = require("../controllers/expenseController");
const router = (0, express_1.Router)();
router.get('/', expenseController_1.getExpensesByUser);
router.get('/paginate', expenseController_1.getPaginatedExpenses);
router.get('/graphs/:period', expenseController_1.getExpenseGraphData);
router.get('/:_id', expenseController_1.getExpenseById);
router.post('/', expenseController_1.addExpense);
router.put('/', expenseController_1.updateExpense);
router.delete('/:_id', expenseController_1.deleteExpense);
exports.default = router;
//# sourceMappingURL=expenseRoutes.js.map