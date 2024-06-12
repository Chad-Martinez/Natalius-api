"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDashboardData = void 0;
const Shift_1 = __importDefault(require("../models/Shift"));
const mongoose_1 = require("mongoose");
const Income_1 = __importDefault(require("../models/Income"));
const dayjs_1 = __importDefault(require("dayjs"));
const Expense_1 = __importDefault(require("../models/Expense"));
const HttpErrorResponse_1 = __importDefault(require("../classes/HttpErrorResponse"));
const Sprint_1 = __importDefault(require("../models/Sprint"));
const getDashboardData = async (req, res, next) => {
    try {
        const { userId } = req;
        if (!userId)
            throw new HttpErrorResponse_1.default(404, 'Requested resource not found');
        const upcomingShifts = await getUpcomingShifts(userId);
        const ytdIncome = await getYTDIncome(userId);
        const ytdExpenses = await getYTDExpenses(userId);
        const sprint = await getActiveSprint(userId);
        res.status(200).json({ sprint, upcomingShifts, ytdIncome, ytdExpenses });
    }
    catch (error) {
        console.error('Dashboard Controller Error: ', error);
        next(error);
    }
};
exports.getDashboardData = getDashboardData;
const getActiveSprint = async (userId) => {
    const sprint = await Sprint_1.default.aggregate([
        {
            $match: {
                userId: new mongoose_1.Types.ObjectId(userId),
                isCompleted: false,
            },
        },
        {
            $lookup: {
                from: 'incomes',
                localField: 'incomes',
                foreignField: '_id',
                as: 'incomeDetails',
            },
        },
        {
            $addFields: {
                progress: { $sum: '$incomeDetails.amount' },
                timeLeft: {
                    $divide: [{ $subtract: ['$end', new Date()] }, 1000 * 60 * 60 * 24],
                },
            },
        },
        {
            $project: {
                _id: 1,
                start: 1,
                end: 1,
                goal: 1,
                progress: 1,
                timeLeft: 1,
            },
        },
    ]).exec();
    return sprint[0];
};
const getUpcomingShifts = async (userId) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const shifts = await Shift_1.default.aggregate([
            {
                $match: {
                    userId: new mongoose_1.Types.ObjectId(userId),
                    start: { $gte: today },
                },
            },
            {
                $sort: {
                    start: 1,
                },
            },
            {
                $limit: 3,
            },
            {
                $lookup: {
                    from: 'gigs',
                    localField: 'gigId',
                    foreignField: '_id',
                    as: 'gigDetails',
                },
            },
            {
                $unwind: '$gigDetails',
            },
            {
                $project: {
                    _id: 1,
                    gigId: 1,
                    gigDetails: 1,
                    start: 1,
                    end: 1,
                    notes: 1,
                    incomeReported: 1,
                },
            },
        ]).exec();
        return shifts;
    }
    catch (error) {
        console.error('Get Next Three Shifts Error: ', error);
    }
};
const getYTDIncome = async (userId) => {
    const ytdIncome = await Income_1.default.aggregate([
        {
            $match: {
                userId: new mongoose_1.Types.ObjectId(userId),
                date: {
                    $gte: new Date((0, dayjs_1.default)().startOf('year').format('MM/DD/YY')),
                },
            },
        },
        {
            $group: {
                _id: null,
                total: { $sum: '$amount' },
            },
        },
    ]).exec();
    return ytdIncome.length > 0 ? ytdIncome[0].total : 0;
};
const getYTDExpenses = async (userId) => {
    const ytdExpenses = await Expense_1.default.aggregate([
        {
            $match: {
                userId: new mongoose_1.Types.ObjectId(userId),
                date: {
                    $gte: new Date((0, dayjs_1.default)().startOf('year').format('MM/DD/YY')),
                },
            },
        },
        {
            $group: {
                _id: null,
                total: { $sum: '$amount' },
            },
        },
    ]).exec();
    return ytdExpenses.length > 0 ? ytdExpenses[0].total : 0;
};
//# sourceMappingURL=dashboardController.js.map