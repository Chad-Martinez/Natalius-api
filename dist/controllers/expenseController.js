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
const utc_1 = __importDefault(require("dayjs/plugin/utc"));
const weekOfYear_1 = __importDefault(require("dayjs/plugin/weekOfYear"));
const Shift_1 = __importDefault(require("../models/Shift"));
const date_time_helpers_1 = require("../helpers/date-time-helpers");
dayjs_1.default.extend(utc_1.default);
dayjs_1.default.extend(weekOfYear_1.default);
dayjs_1.default.extend(dayOfYear_1.default);
dayjs_1.default.extend(quarterOfYear_1.default);
const getExpenseDashboardData = async (req, res, next) => {
    try {
        const { userId } = req;
        if (!userId || !(0, mongoose_1.isValidObjectId)(userId))
            throw new HttpErrorResponse_1.default(400, 'Provided id is not valid');
        const graphData = await getExpenseBarGraphData(userId);
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
    const ytdShiftExpenses = await Shift_1.default.aggregate([
        {
            $match: {
                userId: new mongoose_1.Types.ObjectId(userId),
                start: {
                    $gte: new Date((0, dayjs_1.default)().startOf('year').format('MM/DD/YY')),
                },
            },
        },
        {
            $group: {
                _id: null,
                total: { $sum: '$expenses.totalShiftExpenses' },
            },
        },
    ]).exec();
    const totalExpenses = ytdExpenses[0].total || 0;
    const totalShiftExpenses = ytdShiftExpenses[0].total || 0;
    return totalExpenses + totalShiftExpenses;
};
exports.getYtdExpenseWidgetData = getYtdExpenseWidgetData;
const getExpensePieData = async (userId) => {
    const startOfWeek = (0, date_time_helpers_1.getStartOfWeek)();
    const endOfWeek = (0, date_time_helpers_1.getEndOfWeek)();
    const startOfYear = (0, date_time_helpers_1.getStartOfYear)();
    const endOfYear = (0, date_time_helpers_1.getEndOfYear)();
    const startOfMonth = (0, date_time_helpers_1.getStartOfMonth)();
    const endOfMonth = (0, date_time_helpers_1.getEndOfMonth)();
    const startOfQuarter = (0, date_time_helpers_1.getStartOfQuarter)();
    const endOfQuarter = (0, date_time_helpers_1.getEndOfQuarter)();
    const expensePieData = await Expense_1.default.aggregate([
        {
            $match: {
                userId: new mongoose_1.Types.ObjectId(userId),
            },
        },
        {
            $facet: {
                week: [
                    {
                        $match: {
                            date: {
                                $gte: startOfWeek,
                                $lt: endOfWeek,
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
                            id: {
                                $toLower: {
                                    $concat: [{ $toString: '$_id' }, '_id'],
                                },
                            },
                        },
                    },
                ],
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
                            id: {
                                $toLower: {
                                    $concat: [{ $toString: '$_id' }, '_id'],
                                },
                            },
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
                            id: {
                                $toLower: {
                                    $concat: [{ $toString: '$_id' }, '_id'],
                                },
                            },
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
                            id: {
                                $toLower: {
                                    $concat: [{ $toString: '$_id' }, '_id'],
                                },
                            },
                        },
                    },
                ],
            },
        },
        {
            $addFields: {
                defaultDataSet: {
                    $let: {
                        vars: {
                            datasets: [
                                { name: 'Week', data: '$week' },
                                { name: 'Month', data: '$month' },
                                { name: 'Quarter', data: '$quarter' },
                                { name: 'Year', data: '$year' },
                            ],
                        },
                        in: {
                            $reduce: {
                                input: '$$datasets',
                                initialValue: null,
                                in: {
                                    $cond: {
                                        if: {
                                            $and: [{ $eq: ['$$value', null] }, { $gt: [{ $size: '$$this.data' }, 0] }],
                                        },
                                        then: '$$this.name',
                                        else: '$$value',
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
    ]).exec();
    const shiftExpensePieData = await Shift_1.default.aggregate([
        {
            $match: {
                userId: new mongoose_1.Types.ObjectId(userId),
            },
        },
        {
            $facet: {
                week: [
                    {
                        $match: {
                            start: {
                                $gte: startOfWeek,
                                $lt: endOfWeek,
                            },
                        },
                    },
                    {
                        $group: {
                            _id: null,
                            value: { $sum: '$expenses.totalShiftExpenses' },
                            count: { $sum: 1 },
                        },
                    },
                    {
                        $project: {
                            _id: 0,
                            label: 'SHIFT',
                            value: 1,
                            count: 1,
                            id: 'shift_id',
                        },
                    },
                ],
                month: [
                    {
                        $match: {
                            start: {
                                $gte: startOfMonth,
                                $lt: endOfMonth,
                            },
                        },
                    },
                    {
                        $group: {
                            _id: null,
                            value: { $sum: '$expenses.totalShiftExpenses' },
                            count: { $sum: 1 },
                        },
                    },
                    {
                        $project: {
                            _id: 0,
                            label: 'SHIFT',
                            value: 1,
                            count: 1,
                            id: 'shift_id',
                        },
                    },
                ],
                quarter: [
                    {
                        $match: {
                            start: {
                                $gte: startOfQuarter,
                                $lt: endOfQuarter,
                            },
                        },
                    },
                    {
                        $group: {
                            _id: null,
                            value: { $sum: '$expenses.totalShiftExpenses' },
                            count: { $sum: 1 },
                        },
                    },
                    {
                        $project: {
                            _id: 0,
                            label: 'SHIFT',
                            value: 1,
                            count: 1,
                            id: 'shift_id',
                        },
                    },
                ],
                year: [
                    {
                        $match: {
                            start: {
                                $gte: startOfYear,
                                $lt: endOfYear,
                            },
                        },
                    },
                    {
                        $group: {
                            _id: null,
                            value: { $sum: '$expenses.totalShiftExpenses' },
                            count: { $sum: 1 },
                        },
                    },
                    {
                        $project: {
                            _id: 0,
                            label: 'SHIFT',
                            value: 1,
                            count: 1,
                            id: 'shift_id',
                        },
                    },
                ],
            },
        },
        {
            $addFields: {
                defaultDataSet: {
                    $let: {
                        vars: {
                            datasets: [
                                { name: 'Week', data: '$week' },
                                { name: 'Month', data: '$month' },
                                { name: 'Quarter', data: '$quarter' },
                                { name: 'Year', data: '$year' },
                            ],
                        },
                        in: {
                            $reduce: {
                                input: '$$datasets',
                                initialValue: null,
                                in: {
                                    $cond: {
                                        if: {
                                            $and: [{ $eq: ['$$value', null] }, { $gt: [{ $size: '$$this.data' }, 0] }],
                                        },
                                        then: '$$this.name',
                                        else: '$$value',
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
    ]).exec();
    const combinedExpenses = {
        week: [],
        month: [],
        quarter: [],
        year: [],
        defaultDataSet: '',
    };
    ['week', 'month', 'quarter', 'year'].forEach((period) => {
        if (Array.isArray(expensePieData[0][period]) && Array.isArray(shiftExpensePieData[0][period])) {
            combinedExpenses[period] = [...expensePieData[0][period], ...shiftExpensePieData[0][period]];
        }
        else if (Array.isArray(expensePieData[0][period])) {
            combinedExpenses[period] = [...expensePieData[0][period]];
        }
        else if (Array.isArray(shiftExpensePieData[0][period])) {
            combinedExpenses[period] = [...shiftExpensePieData[0][period]];
        }
    });
    if (expensePieData[0].defaultDataSet === 'Week' || shiftExpensePieData[0].defaultDataSet === 'Week') {
        combinedExpenses.defaultDataSet = 'Week';
    }
    else if (expensePieData[0].defaultDataSet === 'Month' || shiftExpensePieData[0].defaultDataSet === 'Month') {
        combinedExpenses.defaultDataSet = 'Month';
    }
    else if (expensePieData[0].defaultDataSet === 'Quarter' || shiftExpensePieData[0].defaultDataSet === 'Quarter') {
        combinedExpenses.defaultDataSet = 'Quarter';
    }
    else if (expensePieData[0].defaultDataSet === 'Year' || shiftExpensePieData[0].defaultDataSet === 'Year') {
        combinedExpenses.defaultDataSet = 'Year';
    }
    return combinedExpenses;
};
const getExpenseBarGraphData = async (userId) => {
    const startOfWeek = (0, date_time_helpers_1.getStartOfWeek)();
    const endOfWeek = (0, date_time_helpers_1.getEndOfWeek)();
    const startOfYear = (0, date_time_helpers_1.getStartOfYear)();
    const endOfYear = (0, date_time_helpers_1.getEndOfYear)();
    const startOfMonth = (0, date_time_helpers_1.getStartOfMonth)();
    const endOfMonth = (0, date_time_helpers_1.getEndOfMonth)();
    const startOfQuarter = (0, date_time_helpers_1.getStartOfQuarter)();
    const endOfQuarter = (0, date_time_helpers_1.getEndOfQuarter)();
    const matchStage = {
        $match: {
            userId: new mongoose_1.Types.ObjectId(userId),
        },
    };
    const addDefaultDataSetField = {
        $addFields: {
            defaultDataSet: {
                $let: {
                    vars: {
                        datasets: [
                            { name: 'Week', data: '$week' },
                            { name: 'Month', data: '$month' },
                            { name: 'Quarter', data: '$quarter' },
                            { name: 'Year', data: '$year' },
                        ],
                    },
                    in: {
                        $reduce: {
                            input: '$$datasets',
                            initialValue: null,
                            in: {
                                $cond: {
                                    if: {
                                        $and: [{ $eq: ['$$value', null] }, { $gt: [{ $size: '$$this.data' }, 0] }],
                                    },
                                    then: '$$this.name',
                                    else: '$$value',
                                },
                            },
                        },
                    },
                },
            },
        },
    };
    const dayOfWeekLabel = {
        $addFields: {
            label: {
                $arrayElemAt: [date_time_helpers_1.DAYS_OF_WEEK, { $subtract: ['$dayOfWeek', 1] }],
            },
        },
    };
    const weekOfMonthLabel = {
        $addFields: {
            label: {
                $concat: ['Week ', { $toString: '$weekOfMonth' }],
            },
        },
    };
    const monthOfYearLabel = {
        $addFields: {
            label: {
                $arrayElemAt: [date_time_helpers_1.MONTHS_OF_YEAR, { $subtract: ['$month', 1] }],
            },
        },
    };
    const replaceRoot = {
        $replaceRoot: {
            newRoot: {
                $mergeObjects: [
                    '$typeAmount',
                    {
                        label: '$label',
                        type: '$type',
                    },
                ],
            },
        },
    };
    const typeToObject = {
        $project: {
            _id: 0,
            label: '$_id.label',
            type: '$_id.type',
            typeAmount: {
                $arrayToObject: {
                    $map: {
                        input: ['$_id.type'],
                        as: 'type',
                        in: {
                            k: { $toLower: '$$type' },
                            v: '$total',
                        },
                    },
                },
            },
        },
    };
    const expenseGraphData = await Expense_1.default.aggregate([
        matchStage,
        {
            $facet: {
                week: [
                    {
                        $match: {
                            date: {
                                $gte: startOfWeek,
                                $lte: endOfWeek,
                            },
                        },
                    },
                    {
                        $project: {
                            year: { $year: '$date' },
                            month: { $month: '$date' },
                            day: { $dayOfMonth: '$date' },
                            dayOfWeek: { $dayOfWeek: '$date' },
                            amount: 1,
                            type: 1,
                        },
                    },
                    dayOfWeekLabel,
                    {
                        $group: {
                            _id: {
                                year: '$year',
                                month: '$month',
                                day: '$day',
                                type: '$type',
                                label: '$label',
                            },
                            total: { $sum: '$amount' },
                        },
                    },
                    typeToObject,
                    replaceRoot,
                    {
                        $sort: {
                            year: 1,
                            month: 1,
                            day: 1,
                        },
                    },
                ],
                month: [
                    {
                        $match: {
                            date: {
                                $gte: startOfMonth,
                                $lte: endOfMonth,
                            },
                        },
                    },
                    {
                        $project: {
                            year: { $year: '$date' },
                            month: { $month: '$date' },
                            day: { $dayOfMonth: '$date' },
                            weekOfMonth: { $ceil: { $divide: [{ $dayOfMonth: '$date' }, 7] } },
                            amount: 1,
                            type: 1,
                        },
                    },
                    weekOfMonthLabel,
                    {
                        $group: {
                            _id: {
                                year: '$year',
                                month: '$month',
                                day: '$day',
                                type: '$type',
                                label: '$label',
                            },
                            total: { $sum: '$amount' },
                        },
                    },
                    typeToObject,
                    replaceRoot,
                    {
                        $sort: {
                            year: 1,
                            month: 1,
                            day: 1,
                        },
                    },
                ],
                quarter: [
                    {
                        $match: {
                            date: {
                                $gte: startOfQuarter,
                                $lte: endOfQuarter,
                            },
                        },
                    },
                    {
                        $project: {
                            year: { $year: '$date' },
                            month: { $month: '$date' },
                            amount: 1,
                            type: 1,
                        },
                    },
                    monthOfYearLabel,
                    {
                        $group: {
                            _id: {
                                year: '$year',
                                month: '$month',
                                type: '$type',
                                label: '$label',
                            },
                            total: { $sum: '$amount' },
                        },
                    },
                    typeToObject,
                    replaceRoot,
                    {
                        $sort: {
                            year: 1,
                            month: 1,
                        },
                    },
                ],
                year: [
                    {
                        $match: {
                            date: {
                                $gte: startOfYear,
                                $lte: endOfYear,
                            },
                        },
                    },
                    {
                        $project: {
                            year: { $year: '$date' },
                            month: { $month: '$date' },
                            amount: 1,
                            type: 1,
                        },
                    },
                    monthOfYearLabel,
                    {
                        $group: {
                            _id: {
                                year: '$year',
                                month: '$month',
                                type: '$type',
                                label: '$label',
                            },
                            total: { $sum: '$amount' },
                        },
                    },
                    typeToObject,
                    replaceRoot,
                    {
                        $sort: {
                            year: 1,
                            month: 1,
                        },
                    },
                ],
            },
        },
        addDefaultDataSetField,
    ]).exec();
    const shiftExpenseGraphData = await Shift_1.default.aggregate([
        matchStage,
        {
            $facet: {
                week: [
                    {
                        $match: {
                            start: {
                                $gte: startOfWeek,
                                $lte: endOfWeek,
                            },
                        },
                    },
                    {
                        $project: {
                            year: { $year: '$start' },
                            month: { $month: '$start' },
                            day: { $dayOfMonth: '$start' },
                            dayOfWeek: { $dayOfWeek: '$start' },
                            expenses: 1,
                        },
                    },
                    dayOfWeekLabel,
                    {
                        $group: {
                            _id: {
                                label: '$label',
                                type: '$type',
                            },
                            shift: { $sum: '$expenses.totalShiftExpenses' },
                        },
                    },
                    {
                        $project: {
                            _id: 0,
                            label: '$_id.label',
                            type: 'SHIFT',
                            shift: 1,
                        },
                    },
                ],
                month: [
                    {
                        $match: {
                            start: { $gte: startOfMonth, $lte: endOfMonth },
                        },
                    },
                    {
                        $project: {
                            year: { $year: '$start' },
                            month: { $month: '$start' },
                            day: { $dayOfMonth: '$start' },
                            weekOfMonth: { $ceil: { $divide: [{ $dayOfMonth: '$start' }, 7] } },
                            expenses: 1,
                        },
                    },
                    weekOfMonthLabel,
                    {
                        $group: {
                            _id: {
                                week: { $week: '$start' },
                                label: '$label',
                                type: 'SHIFT',
                            },
                            shift: { $sum: '$expenses.totalShiftExpenses' },
                        },
                    },
                    {
                        $project: {
                            _id: 0,
                            label: '$_id.label',
                            type: 'SHIFT',
                            shift: 1,
                        },
                    },
                ],
                quarter: [
                    {
                        $match: {
                            start: { $gte: startOfQuarter, $lte: endOfQuarter },
                        },
                    },
                    {
                        $group: {
                            _id: {
                                month: { $month: '$start' },
                            },
                            shift: { $sum: '$expenses.totalShiftExpenses' },
                        },
                    },
                    {
                        $sort: { '_id.month': 1 },
                    },
                    {
                        $project: {
                            _id: 0,
                            label: {
                                $arrayElemAt: [date_time_helpers_1.MONTHS_OF_YEAR, { $subtract: ['$_id.month', 1] }],
                            },
                            type: 'SHIFT',
                            shift: 1,
                        },
                    },
                ],
                year: [
                    {
                        $match: {
                            start: { $gte: startOfYear, $lte: endOfYear },
                        },
                    },
                    {
                        $group: {
                            _id: {
                                month: { $month: '$start' },
                            },
                            shift: { $sum: '$expenses.totalShiftExpenses' },
                        },
                    },
                    {
                        $sort: { '_id.month': 1 },
                    },
                    {
                        $project: {
                            _id: 0,
                            label: {
                                $arrayElemAt: [date_time_helpers_1.MONTHS_OF_YEAR, { $subtract: ['$_id.month', 1] }],
                            },
                            type: 'SHIFT',
                            shift: 1,
                        },
                    },
                ],
            },
        },
        addDefaultDataSetField,
    ]).exec();
    const expenseBarGraphSet = expenseGraphData.length > 0 ? expenseGraphData[0] : {};
    const shiftExpenseBarGraphSet = shiftExpenseGraphData.length > 0 ? shiftExpenseGraphData[0] : {};
    const mergedExpenseBarGraphSet = mergeDataSets(expenseBarGraphSet, shiftExpenseBarGraphSet);
    if (expenseBarGraphSet.defaultDataSet === 'Week' || shiftExpenseBarGraphSet.defaultDataSet === 'Week') {
        mergedExpenseBarGraphSet.defaultDataSet = 'Week';
    }
    else if (expenseBarGraphSet.defaultDataSet === 'Month' || shiftExpenseBarGraphSet.defaultDataSet === 'Month') {
        mergedExpenseBarGraphSet.defaultDataSet = 'Month';
    }
    else if (expenseBarGraphSet.defaultDataSet === 'Quarter' || shiftExpenseBarGraphSet.defaultDataSet === 'Quarter') {
        mergedExpenseBarGraphSet.defaultDataSet = 'Quarter';
    }
    else if (expenseBarGraphSet.defaultDataSet === 'Year' || shiftExpenseBarGraphSet.defaultDataSet === 'Year') {
        mergedExpenseBarGraphSet.defaultDataSet = 'Year';
    }
    return { expenseBarGraphSet, shiftExpenseBarGraphSet, mergedExpenseBarGraphSet };
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
const mergeDataSets = (setOne, setTwo) => {
    const mergedSets = {};
    ['week', 'month', 'quarter', 'year'].forEach((period) => {
        const set1 = (setOne[period] || []);
        const set2 = (setTwo[period] || []);
        mergedSets[period] = [...set1, ...set2];
    });
    return mergedSets;
};
//# sourceMappingURL=expenseController.js.map