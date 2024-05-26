"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteExpense = exports.updateExpense = exports.addExpense = exports.getExpenseById = exports.getExpenseGraphData = exports.getPaginatedExpenses = exports.getExpensesByUser = void 0;
const HttpErrorResponse_1 = __importDefault(require("../classes/HttpErrorResponse"));
const Expense_1 = __importDefault(require("../models/Expense"));
const mongoose_1 = require("mongoose");
const dayjs_1 = __importDefault(require("dayjs"));
const dayOfYear_1 = __importDefault(require("dayjs/plugin/dayOfYear"));
const quarterOfYear_1 = __importDefault(require("dayjs/plugin/quarterOfYear"));
dayjs_1.default.extend(dayOfYear_1.default);
dayjs_1.default.extend(quarterOfYear_1.default);
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
            const income = await Expense_1.default.find({ userId }, { __v: 0 }, { skip: (+page - 1) * +limit, limit: +limit })
                .sort({
                date: 1,
            })
                .populate({
                path: 'vendorId',
                select: { name: 1, defaultType: 1 },
            })
                .exec();
            res.status(200).json({ income, count, pages: Math.ceil(count / +limit) });
        }
        else {
            res.status(200).json({ income: [], count, pages: 0 });
        }
    }
    catch (error) {
        console.error('Expense Controller Error - PaginatedExpenses: ', error);
        next(error);
    }
};
exports.getPaginatedExpenses = getPaginatedExpenses;
const getExpenseGraphData = async (req, res, next) => {
    try {
        const { userId } = req;
        const { period } = req.params;
        let queryDate;
        switch (period) {
            case 'week':
                queryDate = (0, dayjs_1.default)().startOf('week');
                break;
            case 'month':
                queryDate = (0, dayjs_1.default)().startOf('month');
                break;
            case 'quarter':
                queryDate = (0, dayjs_1.default)().startOf('quarter');
                break;
            case 'year':
                queryDate = (0, dayjs_1.default)().startOf('year');
                break;
            default:
                queryDate = (0, dayjs_1.default)().startOf('week');
                break;
        }
        const pipline = [
            {
                $match: {
                    userId: new mongoose_1.Types.ObjectId(userId),
                    date: {
                        $gte: new Date(queryDate.format('MM/DD/YY')),
                    },
                },
            },
        ];
        if (period === 'week') {
            pipline.push({
                $project: {
                    year: { $year: '$date' },
                    month: { $month: '$date' },
                    day: { $dayOfMonth: '$date' },
                    amount: 1,
                    type: 1,
                },
            }, {
                $group: {
                    _id: {
                        year: '$year',
                        month: '$month',
                        day: '$day',
                        type: '$type',
                    },
                    totalAmount: { $sum: '$amount' },
                },
            }, {
                $sort: {
                    '_id.year': 1,
                    '_id.month': 1,
                    '_id.day': 1,
                    '_id.type': 1,
                },
            }, {
                $project: {
                    year: '$_id.year',
                    month: '$_id.month',
                    day: '$_id.day',
                    type: '$_id.type',
                    totalAmount: { $round: ['$totalAmount', 2] },
                    _id: 0,
                },
            });
        }
        else {
            pipline.push({
                $project: {
                    year: { $year: '$date' },
                    month: { $month: '$date' },
                    amount: 1,
                    type: 1,
                },
            }, {
                $group: {
                    _id: {
                        year: '$year',
                        month: '$month',
                        type: '$type',
                    },
                    totalAmount: { $sum: '$amount' },
                },
            }, {
                $sort: {
                    '_id.year': 1,
                    '_id.month': 1,
                    '_id.type': 1,
                },
            }, {
                $project: {
                    year: '$_id.year',
                    month: '$_id.month',
                    type: '$_id.type',
                    totalAmount: { $round: ['$totalAmount', 2] },
                    _id: 0,
                },
            });
        }
        const expenses = await Expense_1.default.aggregate(pipline);
        res.status(200).json(expenses);
    }
    catch (error) {
        console.error('Expense Controller Error - ExpenseGraphData: ', error);
        next(error);
    }
};
exports.getExpenseGraphData = getExpenseGraphData;
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
        const { vendorId, date, amount, type, distance } = req.body;
        const { userId } = req;
        const expense = new Expense_1.default({
            vendorId,
            date,
            amount,
            type,
            distance,
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
        const { _id, vendorId, date, amount, type, distance } = req.body;
        if (!(0, mongoose_1.isValidObjectId)(_id))
            throw new HttpErrorResponse_1.default(400, 'Provided id is not valid');
        const expense = await Expense_1.default.findById(_id);
        if (!expense)
            throw new HttpErrorResponse_1.default(404, 'Requested resource not found');
        expense.vendorId = vendorId;
        expense.date = date;
        expense.amount = amount;
        expense.type = type;
        expense.distance = distance;
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
        res.status(200).json({ message: 'Income deleted' });
    }
    catch (error) {
        console.error('Expense Controller Error - DeleteExpense: ', error);
        next(error);
    }
};
exports.deleteExpense = deleteExpense;
exports.default = {
    getExpensesByUser: exports.getExpensesByUser,
    getPaginatedExpenses: exports.getPaginatedExpenses,
    getExpenseGraphData: exports.getExpenseGraphData,
    getExpenseById: exports.getExpenseById,
    addExpense: exports.addExpense,
    updateExpense: exports.updateExpense,
    deleteExpense: exports.deleteExpense,
};
//# sourceMappingURL=expenseController.js.map