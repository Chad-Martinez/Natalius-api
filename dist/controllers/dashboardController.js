"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDashboardData = void 0;
const HttpErrorResponse_1 = __importDefault(require("../classes/HttpErrorResponse"));
const shiftController_1 = require("./shiftController");
const incomeController_1 = require("./incomeController");
const expenseController_1 = require("./expenseController");
const sprintController_1 = require("./sprintController");
const getDashboardData = async (req, res, next) => {
    try {
        const { userId } = req;
        if (!userId)
            throw new HttpErrorResponse_1.default(404, 'Requested resource not found');
        const upcomingShifts = await (0, shiftController_1.getUpcomingShiftWidgetData)(userId);
        const ytdIncome = await (0, incomeController_1.getYtdIncomeWidgetData)(userId);
        const ytdExpenses = await (0, expenseController_1.getYtdExpenseWidgetData)(userId);
        const sprint = await (0, sprintController_1.getSprintWidgetData)(userId);
        const shiftPrediction = await (0, incomeController_1.perdictNextShiftIncome)(userId);
        res.status(200).json({ sprint, upcomingShifts, ytdIncome, ytdExpenses, shiftPrediction });
    }
    catch (error) {
        console.error('Dashboard Controller Error: ', error);
        next(error);
    }
};
exports.getDashboardData = getDashboardData;
//# sourceMappingURL=dashboardController.js.map