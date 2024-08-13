"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteExpense = exports.updateExpense = exports.addExpense = exports.getExpenseById = exports.getYtdExpenseWidgetData = exports.getPaginatedExpenses = exports.getExpensesByUser = exports.getExpenseDashboardData = void 0;
const HttpErrorResponse_1 = __importDefault(require("../classes/HttpErrorResponse"));
const Expense_1 = __importDefault(require("../models/Expense"));
const mongoose_1 = require("mongoose");
const dayjs_1 = __importDefault(require("dayjs"));
const dayOfYear_1 = __importDefault(require("dayjs/plugin/dayOfYear"));
const quarterOfYear_1 = __importDefault(require("dayjs/plugin/quarterOfYear"));
dayjs_1.default.extend(dayOfYear_1.default);
dayjs_1.default.extend(quarterOfYear_1.default);
const getExpenseDashboardData = async (req, res, next) => {
    try {
        const { userId } = req;
        if (!userId || !(0, mongoose_1.isValidObjectId)(userId))
            throw new HttpErrorResponse_1.default(400, 'Provided id is not valid');
        const graphData = await getExpenseGraphData(userId);
        const pieData = await getExpensePieData(userId);
        res.status(200).json({ graphData, pieData });
    }
    catch (error) {
        console.error('Expense Controller Error - ExpenseDashboardData: ', error);
        next(error);
    }
};
exports.getExpenseDashboardData = getExpenseDashboardData;
const getExpensesByUser = async (req, res, next) => {
    try {
        const { userId } = req;
        if (!(0, mongoose_1.isValidObjectId)(userId))
            throw new HttpErrorResponse_1.default(400, 'Provided id is not valid');
        const expenses = await Expense_1.default.find({ userId: userId })
            .sort({ date: 1 })
            .populate({
            path: 'vendorId',
            select: { name: 1, defaultType: 1 },
        });
        res.status(200).json(expenses);
    }
    catch (error) {
        console.error('Expense Controller Error - GetExpenseByUser: ', error);
        next(error);
    }
};
exports.getExpensesByUser = getExpensesByUser;
const getPaginatedExpenses = async (req, res, next) => {
    try {
        const { page, limit } = req.query;
        const { userId } = req;
        if (!(0, mongoose_1.isValidObjectId)(userId))
            throw new HttpErrorResponse_1.default(400, 'Provided id is not valid');
        if (!page || !limit) {
            throw new HttpErrorResponse_1.default(400, 'Missing proper query parameters');
        }
        const count = await Expense_1.default.find({ userId }).countDocuments();
        if (count) {
            const expenses = await Expense_1.default.aggregate([
                {
                    $match: {
                        userId: new mongoose_1.Types.ObjectId(userId),
                    },
                },
                {
                    $sort: {
                        date: -1,
                    },
                },
                {
                    $skip: (+page - 1) * +limit,
                },
                {
                    $limit: +limit,
                },
                {
                    $lookup: {
                        from: 'vendors',
                        localField: 'vendorId',
                        foreignField: '_id',
                        as: 'vendorDetails',
                    },
                },
                {
                    $unwind: '$vendorDetails',
                },
                {
                    $addFields: {
                        vendor: '$vendorDetails.name',
                    },
                },
                {
                    $project: {
                        _id: 1,
                        vendorId: 1,
                        vendor: 1,
                        date: 1,
                        amount: 1,
                        type: 1,
                        notes: 1,
                    },
                },
            ]);
            res.status(200).json({ expenses, count, pages: Math.ceil(count / +limit) });
        }
        else {
            res.status(200).json({ expenses: [], count, pages: 0 });
        }
    }
    catch (error) {
        console.error('Expense Controller Error - PaginatedExpenses: ', error);
        next(error);
    }
};
exports.getPaginatedExpenses = getPaginatedExpenses;
const getYtdExpenseWidgetData = async (userId) => {
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
exports.getYtdExpenseWidgetData = getYtdExpenseWidgetData;
const getExpensePieData = async (userId) => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(startOfMonth);
    endOfMonth.setMonth(startOfMonth.getMonth() + 1);
    const quarter = Math.floor((now.getMonth() + 3) / 3);
    const startOfQuarter = new Date(now.getFullYear(), (quarter - 1) * 3, 1);
    const endOfQuarter = new Date(startOfQuarter);
    endOfQuarter.setMonth(startOfQuarter.getMonth() + 3);
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const endOfYear = new Date(startOfYear);
    endOfYear.setFullYear(startOfYear.getFullYear() + 1);
    const expensePieData = await Expense_1.default.aggregate([
        {
            $match: {
                userId: new mongoose_1.Types.ObjectId(userId),
            },
        },
        {
            $facet: {
                month: [
                    {
                        $match: {
                            date: {
                                $gte: startOfMonth,
                                $lt: endOfMonth,
                            },
                        },
                    },
                    {
                        $group: {
                            _id: '$type',
                            value: { $sum: '$amount' },
                            count: { $sum: 1 },
                        },
                    },
                    {
                        $project: {
                            _id: 0,
                            label: '$_id',
                            value: 1,
                            count: 1,
                        },
                    },
                ],
                quarter: [
                    {
                        $match: {
                            date: {
                                $gte: startOfQuarter,
                                $lt: endOfQuarter,
                            },
                        },
                    },
                    {
                        $group: {
                            _id: '$type',
                            value: { $sum: '$amount' },
                            count: { $sum: 1 },
                        },
                    },
                    {
                        $project: {
                            _id: 0,
                            label: '$_id',
                            value: 1,
                            count: 1,
                        },
                    },
                ],
                year: [
                    {
                        $match: {
                            date: {
                                $gte: startOfYear,
                                $lt: endOfYear,
                            },
                        },
                    },
                    {
                        $group: {
                            _id: '$type',
                            value: { $sum: '$amount' },
                            count: { $sum: 1 },
                        },
                    },
                    {
                        $project: {
                            _id: 0,
                            label: '$_id',
                            value: 1,
                            count: 1,
                        },
                    },
                ],
            },
        },
        {
            $addFields: {
                defaultDataSet: {
                    $cond: [
                        { $gt: [{ $size: { $filter: { input: '$month', as: 'item', cond: { $gt: ['$$item.value', 0] } } } }, 0] },
                        'month',
                        {
                            $cond: [
                                { $gt: [{ $size: { $filter: { input: '$quarter', as: 'item', cond: { $gt: ['$$item.value', 0] } } } }, 0] },
                                'quarter',
                                {
                                    $cond: [{ $gt: [{ $size: { $filter: { input: '$year', as: 'item', cond: { $gt: ['$$item.value', 0] } } } }, 0] }, 'year', 'none'],
                                },
                            ],
                        },
                    ],
                },
            },
        },
    ]).exec();
    return expensePieData.length > 0 ? expensePieData[0] : null;
};
const getExpenseGraphData = async (userId) => {
    const startOfWeek = new Date();
    startOfWeek.setHours(0, 0, 0, 0);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    const endOfWeek = new Date();
    endOfWeek.setHours(23, 59, 59, 999);
    endOfWeek.setDate(endOfWeek.getDate() + (6 - endOfWeek.getDay()));
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const endOfMonth = new Date(startOfMonth);
    endOfMonth.setMonth(endOfMonth.getMonth() + 1);
    endOfMonth.setMilliseconds(-1);
    const currentMonth = startOfMonth.getMonth();
    const startOfQuarter = new Date(startOfMonth);
    startOfQuarter.setMonth(currentMonth - (currentMonth % 3));
    const endOfQuarter = new Date(startOfQuarter);
    endOfQuarter.setMonth(startOfQuarter.getMonth() + 3);
    endOfQuarter.setMilliseconds(-1);
    const startOfYear = new Date(startOfMonth);
    startOfYear.setMonth(0);
    const endOfYear = new Date(startOfYear);
    endOfYear.setFullYear(startOfYear.getFullYear() + 1);
    endOfYear.setMilliseconds(-1);
    const monthsOfYear = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const expenseGraphData = await Expense_1.default.aggregate([
        {
            $match: {
                userId: new mongoose_1.Types.ObjectId(userId),
            },
        },
        {
            $facet: {
                weeklyExpenseCurrentMonth: [
                    {
                        $match: {
                            date: { $gte: startOfMonth, $lte: endOfMonth },
                        },
                    },
                    {
                        $group: {
                            _id: {
                                week: { $week: '$date' },
                                type: '$type',
                            },
                            totalExpense: { $sum: '$amount' },
                        },
                    },
                    {
                        $sort: { '_id.week': 1 },
                    },
                    {
                        $group: {
                            _id: '$_id.week',
                            types: {
                                $push: {
                                    type: '$_id.type',
                                    totalExpense: '$totalExpense',
                                },
                            },
                        },
                    },
                    {
                        $project: {
                            _id: 0,
                            week: { $concat: ['Week ', { $toString: '$_id' }] },
                            types: 1,
                        },
                    },
                ],
                monthExpenseCurrentQuarter: [
                    {
                        $match: {
                            date: { $gte: startOfQuarter, $lte: endOfQuarter },
                        },
                    },
                    {
                        $group: {
                            _id: {
                                month: { $month: '$date' },
                                type: '$type',
                            },
                            totalExpense: { $sum: '$amount' },
                        },
                    },
                    {
                        $sort: { '_id.month': 1 },
                    },
                    {
                        $group: {
                            _id: '$_id.month',
                            types: {
                                $push: {
                                    type: '$_id.type',
                                    totalExpense: '$totalExpense',
                                },
                            },
                        },
                    },
                    {
                        $project: {
                            _id: 0,
                            month: {
                                $arrayElemAt: [monthsOfYear, { $subtract: ['$_id', 1] }],
                            },
                            types: 1,
                        },
                    },
                ],
                monthlyExpenseCurrentYear: [
                    {
                        $match: {
                            date: { $gte: startOfYear, $lte: endOfYear },
                        },
                    },
                    {
                        $group: {
                            _id: {
                                month: { $month: '$date' },
                                type: '$type',
                            },
                            totalExpense: { $sum: '$amount' },
                        },
                    },
                    {
                        $sort: { '_id.month': 1 },
                    },
                    {
                        $group: {
                            _id: '$_id.month',
                            types: {
                                $push: {
                                    type: '$_id.type',
                                    totalExpense: '$totalExpense',
                                },
                            },
                        },
                    },
                    {
                        $project: {
                            _id: 0,
                            month: {
                                $arrayElemAt: [monthsOfYear, { $subtract: ['$_id', 1] }],
                            },
                            types: 1,
                        },
                    },
                ],
            },
        },
    ]).exec();
    return expenseGraphData.length > 0 ? expenseGraphData[0] : null;
};
const getExpenseById = async (req, res, next) => {
    try {
        const { _id } = req.params;
        if (!(0, mongoose_1.isValidObjectId)(_id))
            throw new HttpErrorResponse_1.default(400, 'Provided id is not valid');
        const expense = await Expense_1.default.findById(_id).populate({
            path: 'vendorId',
            select: { name: 1, defaultType: 1 },
        });
        if (!expense)
            throw new HttpErrorResponse_1.default(404, 'Requested resource not found');
        res.status(200).json(expense);
    }
    catch (error) {
        console.error('Expense Controller Error - GetExpenseById: ', error);
        next(error);
    }
};
exports.getExpenseById = getExpenseById;
const addExpense = async (req, res, next) => {
    try {
        const { vendorId, date, amount, type, notes } = req.body;
        const { userId } = req;
        const expense = new Expense_1.default({
            vendorId,
            date,
            amount,
            type,
            notes,
            userId,
        });
        await expense.save();
        res.status(201).json({ _id: expense._id });
    }
    catch (error) {
        console.error('Expense Controller Error - AddExpense: ', error);
        if (error.name === 'ValidationError') {
            const err = new HttpErrorResponse_1.default(422, error.message);
            next(err);
        }
        else {
            next(error);
        }
    }
};
exports.addExpense = addExpense;
const updateExpense = async (req, res, next) => {
    try {
        const { _id } = req.body;
        if (!(0, mongoose_1.isValidObjectId)(_id))
            throw new HttpErrorResponse_1.default(400, 'Provided id is not valid');
        const expense = await Expense_1.default.findById(_id);
        if (!expense)
            throw new HttpErrorResponse_1.default(404, 'Requested resource not found');
        delete req.body._id;
        const updates = Object.keys(req.body);
        updates.forEach((update) => {
            expense[update] = req.body[update];
        });
        await expense.save();
        res.status(200).json({ message: 'Expense update successful' });
    }
    catch (error) {
        console.error('Expense Controller Error - UpdateExpense: ', error);
        if (error.name === 'ValidationError') {
            const err = new HttpErrorResponse_1.default(422, error.message);
            next(err);
        }
        else {
            next(error);
        }
    }
};
exports.updateExpense = updateExpense;
const deleteExpense = async (req, res, next) => {
    try {
        const { _id } = req.params;
        if (!(0, mongoose_1.isValidObjectId)(_id)) {
            throw new HttpErrorResponse_1.default(400, 'Provided id is not valid');
        }
        await Expense_1.default.deleteOne({ _id });
        res.status(200).json({ message: 'Expense deleted' });
    }
    catch (error) {
        console.error('Expense Controller Error - DeleteExpense: ', error);
        next(error);
    }
};
exports.deleteExpense = deleteExpense;
exports.default = {
    getExpenseDashboardData: exports.getExpenseDashboardData,
    getExpensesByUser: exports.getExpensesByUser,
    getPaginatedExpenses: exports.getPaginatedExpenses,
    getYtdExpenseWidgetData: exports.getYtdExpenseWidgetData,
    getExpenseGraphData,
    getExpenseById: exports.getExpenseById,
    addExpense: exports.addExpense,
    updateExpense: exports.updateExpense,
    deleteExpense: exports.deleteExpense,
};
//# sourceMappingURL=expenseController.js.map