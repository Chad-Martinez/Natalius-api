import { Request, Response, NextFunction, RequestHandler } from 'express';
import HttpErrorResponse from '../classes/HttpErrorResponse';
import Expense from '../models/Expense';
import { HydratedDocument, Types, isValidObjectId } from 'mongoose';
import { IExpense } from '../interfaces/Expense.interface';
import { ICustomRequest } from '../interfaces/CustomeRequest.interface';
import dayjs from 'dayjs';
import dayOfYear from 'dayjs/plugin/dayOfYear';
import quarterOfYear from 'dayjs/plugin/quarterOfYear';
import Shift from '../models/Shift';
import { PieData, GraphSet, GraphType, GraphCurrentPeriod } from '../types/expense-types';
dayjs.extend(dayOfYear);
dayjs.extend(quarterOfYear);

export const getExpenseDashboardData = async (req: ICustomRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userId } = req;

    if (!userId || !isValidObjectId(userId)) throw new HttpErrorResponse(400, 'Provided id is not valid');

    const graphData = await getExpenseGraphData(userId);
    const pieData = await getExpensePieData(userId);
    // console.log('pie data ', pieData);

    res.status(200).json({ graphData, pieData });
  } catch (error) {
    console.error('Expense Controller Error - ExpenseDashboardData: ', error);
    next(error);
  }
};

export const getExpensesByUser: RequestHandler = async (req: ICustomRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userId } = req;

    if (!isValidObjectId(userId)) throw new HttpErrorResponse(400, 'Provided id is not valid');

    const expenses: HydratedDocument<IExpense>[] = await Expense.find({ userId: userId })
      .sort({ date: 1 })
      .populate({
        path: 'vendorId',
        select: { name: 1, defaultType: 1 },
      });

    res.status(200).json(expenses);
  } catch (error) {
    console.error('Expense Controller Error - GetExpenseByUser: ', error);
    next(error);
  }
};

export const getPaginatedExpenses: RequestHandler = async (req: ICustomRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { page, limit } = req.query;

    const { userId } = req;

    if (!isValidObjectId(userId)) throw new HttpErrorResponse(400, 'Provided id is not valid');

    if (!page || !limit) {
      throw new HttpErrorResponse(400, 'Missing proper query parameters');
    }

    const count = await Expense.find({ userId }).countDocuments();

    if (count) {
      const expenses = await Expense.aggregate([
        {
          $match: {
            userId: new Types.ObjectId(userId),
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
    } else {
      res.status(200).json({ expenses: [], count, pages: 0 });
    }
  } catch (error) {
    console.error('Expense Controller Error - PaginatedExpenses: ', error);
    next(error);
  }
};

export const getYtdExpenseWidgetData = async (userId: string): Promise<number> => {
  const ytdExpenses = await Expense.aggregate([
    {
      $match: {
        userId: new Types.ObjectId(userId),
        date: {
          $gte: new Date(dayjs().startOf('year').format('MM/DD/YY')),
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

  const ytdShiftExpenses = await Shift.aggregate([
    {
      $match: {
        userId: new Types.ObjectId(userId),
        start: {
          $gte: new Date(dayjs().startOf('year').format('MM/DD/YY')),
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

const getExpensePieData = async (userId: string) => {
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

  const expensePieData = await Expense.aggregate([
    {
      $match: {
        userId: new Types.ObjectId(userId),
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

  const shiftExpensePieData = await Shift.aggregate([
    {
      $match: {
        userId: new Types.ObjectId(userId),
      },
    },
    {
      $facet: {
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

  const combinedExpenses: PieData = {
    month: [],
    quarter: [],
    year: [],
    defaultDataSet: '',
  };

  ['month', 'quarter', 'year'].forEach((period) => {
    // @ts-ignore
    if (Array.isArray(expensePieData[0][period]) && Array.isArray(shiftExpensePieData[0][period])) {
      // @ts-ignore
      combinedExpenses[period] = [...expensePieData[0][period], ...shiftExpensePieData[0][period]];
      // @ts-ignore
    } else if (Array.isArray(expensePieData[0][period])) {
      // @ts-ignore
      combinedExpenses[period] = [...expensePieData[0][period]];
      // @ts-ignore
    } else if (Array.isArray(shiftExpensePieData[0][period])) {
      // @ts-ignore
      combinedExpenses[period] = [...shiftExpensePieData[0][period]];
    }
  });

  if (expensePieData[0].defaultDataSet === 'month' || shiftExpensePieData[0].defaultDataSet === 'month') {
    combinedExpenses.defaultDataSet = 'month';
  } else if (expensePieData[0].defaultDataSet === 'quarter' || shiftExpensePieData[0].defaultDataSet === 'quarter') {
    combinedExpenses.defaultDataSet = 'quarter';
  } else if (expensePieData[0].defaultDataSet === 'year' || shiftExpensePieData[0].defaultDataSet === 'year') {
    combinedExpenses.defaultDataSet = 'year';
  }

  return combinedExpenses;
};

const getExpenseGraphData = async (userId: string) => {
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

  const expenseGraphData = await Expense.aggregate([
    {
      $match: {
        userId: new Types.ObjectId(userId),
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
        monthlyExpenseCurrentQuarter: [
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

  const shiftExpenseGraphData = await Shift.aggregate([
    {
      $match: {
        userId: new Types.ObjectId(userId),
      },
    },
    {
      $facet: {
        weeklyExpenseCurrentMonth: [
          {
            $match: {
              start: { $gte: startOfMonth, $lte: endOfMonth },
            },
          },
          {
            $group: {
              _id: {
                week: { $week: '$start' },
              },
              totalExpense: { $sum: '$expenses.totalShiftExpenses' },
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
                  type: 'SHIFT',
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
        monthlyExpenseCurrentQuarter: [
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
              totalExpense: { $sum: '$expenses.totalShiftExpenses' },
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
                  type: 'SHIFT',
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
              start: { $gte: startOfYear, $lte: endOfYear },
            },
          },
          {
            $group: {
              _id: {
                month: { $month: '$start' },
              },
              totalExpense: { $sum: '$expenses.totalShiftExpenses' },
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
                  type: 'SHIFT',
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

  const expenseGraphSet = expenseGraphData.length > 0 ? (expenseGraphData[0] as GraphSet) : ({} as GraphSet);
  const shiftExpenseGraphSet = shiftExpenseGraphData.length > 0 ? (shiftExpenseGraphData[0] as GraphSet) : ({} as GraphSet);

  const mergedExpenseGraphSet = mergeExpenseData(expenseGraphSet, shiftExpenseGraphSet);

  return { expenseGraphSet, shiftExpenseGraphSet, mergedExpenseGraphSet };
};

export const getExpenseById: RequestHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { _id } = req.params;

    if (!isValidObjectId(_id)) throw new HttpErrorResponse(400, 'Provided id is not valid');

    const expense: HydratedDocument<IExpense> | null = await Expense.findById(_id).populate({
      path: 'vendorId',
      select: { name: 1, defaultType: 1 },
    });

    if (!expense) throw new HttpErrorResponse(404, 'Requested resource not found');

    res.status(200).json(expense);
  } catch (error) {
    console.error('Expense Controller Error - GetExpenseById: ', error);
    next(error);
  }
};

export const addExpense: RequestHandler = async (req: ICustomRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { vendorId, date, amount, type, notes } = req.body;

    const { userId } = req;

    const expense = new Expense({
      vendorId,
      date,
      amount,
      type,
      notes,
      userId,
    });

    await expense.save();

    res.status(201).json({ _id: expense._id });
  } catch (error) {
    console.error('Expense Controller Error - AddExpense: ', error);
    if (error.name === 'ValidationError') {
      const err = new HttpErrorResponse(422, error.message);
      next(err);
    } else {
      next(error);
    }
  }
};

export const updateExpense: RequestHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { _id } = req.body;

    if (!isValidObjectId(_id)) throw new HttpErrorResponse(400, 'Provided id is not valid');

    const expense: HydratedDocument<IExpense> | null = await Expense.findById(_id);

    if (!expense) throw new HttpErrorResponse(404, 'Requested resource not found');

    delete req.body._id;

    const updates = Object.keys(req.body);

    updates.forEach((update: string) => {
      // @ts-ignore
      expense[update] = req.body[update];
    });

    await expense.save();

    res.status(200).json({ message: 'Expense update successful' });
  } catch (error) {
    console.error('Expense Controller Error - UpdateExpense: ', error);
    if (error.name === 'ValidationError') {
      const err = new HttpErrorResponse(422, error.message);
      next(err);
    } else {
      next(error);
    }
  }
};

export const deleteExpense: RequestHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { _id } = req.params;

    if (!isValidObjectId(_id)) {
      throw new HttpErrorResponse(400, 'Provided id is not valid');
    }

    await Expense.deleteOne({ _id });

    res.status(200).json({ message: 'Expense deleted' });
  } catch (error) {
    console.error('Expense Controller Error - DeleteExpense: ', error);
    next(error);
  }
};

export default {
  getExpenseDashboardData,
  getExpensesByUser,
  getPaginatedExpenses,
  getYtdExpenseWidgetData,
  getExpenseGraphData,
  getExpenseById,
  addExpense,
  updateExpense,
  deleteExpense,
};

const mergeExpenseData = (expenseGraphData: GraphSet, shiftExpenseGraphData: GraphSet) => {
  const mergeTypes = (types1: GraphType[], types2: GraphType[]) => {
    const typeMap = new Map();

    types1.forEach((type) => typeMap.set(type.type, type));

    types2.forEach((type) => (typeMap.has(type.type) ? (typeMap.get(type.type).totalExpense += type.totalExpense) : typeMap.set(type.type, type)));

    return Array.from(typeMap.values());
  };

  const mergeByKey = (arr1: GraphCurrentPeriod[], arr2: GraphCurrentPeriod[], key: string) => {
    const allData = [...arr1, ...arr2];

    const dataMap = new Map();

    allData.forEach((item: GraphCurrentPeriod) => {
      // @ts-ignore
      const currentKey = item[key];
      if (dataMap.has(currentKey)) {
        const existingItem = dataMap.get(currentKey);
        existingItem.types = mergeTypes(existingItem.types, item.types);
      } else {
        dataMap.set(currentKey, { ...item });
      }
    });

    return Array.from(dataMap.values());
  };

  const mergedWeeklyExpenseCurrentMonth = mergeByKey(
    expenseGraphData.weeklyExpenseCurrentMonth,
    shiftExpenseGraphData.weeklyExpenseCurrentMonth,
    'week',
  );

  const mergedMonthExpenseCurrentQuarter = mergeByKey(
    expenseGraphData.monthlyExpenseCurrentQuarter,
    shiftExpenseGraphData.monthlyExpenseCurrentQuarter,
    'month',
  );

  const mergedMonthlyExpenseCurrentYear = mergeByKey(
    expenseGraphData.monthlyExpenseCurrentYear,
    shiftExpenseGraphData.monthlyExpenseCurrentYear,
    'month',
  );

  return {
    weeklyExpenseCurrentMonth: mergedWeeklyExpenseCurrentMonth,
    monthlyExpenseCurrentQuarter: mergedMonthExpenseCurrentQuarter,
    monthlyExpenseCurrentYear: mergedMonthlyExpenseCurrentYear,
  };
};
