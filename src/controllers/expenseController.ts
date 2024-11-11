import { Request, Response, NextFunction, RequestHandler } from 'express';
import HttpErrorResponse from '../classes/HttpErrorResponse';
import Expense from '../models/Expense';
import { HydratedDocument, PipelineStage, Types, isValidObjectId } from 'mongoose';
import { IExpense } from '../interfaces/Expense.interface';
import { ICustomRequest } from '../interfaces/CustomeRequest.interface';
import dayjs from 'dayjs';
import dayOfYear from 'dayjs/plugin/dayOfYear';
import quarterOfYear from 'dayjs/plugin/quarterOfYear';
import utc from 'dayjs/plugin/utc';
import weekOfYear from 'dayjs/plugin/weekOfYear';
import Shift from '../models/Shift';
import { PieData, GraphSet } from '../types/expense-types';
import {
  DAYS_OF_WEEK,
  getEndOfMonth,
  getEndOfQuarter,
  getEndOfWeek,
  getEndOfYear,
  getStartOfMonth,
  getStartOfQuarter,
  getStartOfWeek,
  getStartOfYear,
  MONTHS_OF_YEAR,
} from '../helpers/date-time-helpers';
dayjs.extend(utc);
dayjs.extend(weekOfYear);
dayjs.extend(dayOfYear);
dayjs.extend(quarterOfYear);

export const getExpenseDashboardData = async (req: ICustomRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userId } = req;

    if (!userId || !isValidObjectId(userId)) throw new HttpErrorResponse(400, 'Provided id is not valid');

    const graphData = await getExpenseBarGraphData(userId);
    const pieData = await getExpensePieData(userId);

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
  const startOfWeek: Date = getStartOfWeek();
  const endOfWeek: Date = getEndOfWeek();

  const startOfYear: Date = getStartOfYear();
  const endOfYear: Date = getEndOfYear();

  const startOfMonth: Date = getStartOfMonth();
  const endOfMonth: Date = getEndOfMonth();

  const startOfQuarter: Date = getStartOfQuarter();
  const endOfQuarter: Date = getEndOfQuarter();

  const expensePieData = await Expense.aggregate([
    {
      $match: {
        userId: new Types.ObjectId(userId),
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

  const shiftExpensePieData = await Shift.aggregate([
    {
      $match: {
        userId: new Types.ObjectId(userId),
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

  const combinedExpenses: PieData = {
    week: [],
    month: [],
    quarter: [],
    year: [],
    defaultDataSet: '',
  };

  ['week', 'month', 'quarter', 'year'].forEach((period) => {
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

  if (expensePieData[0].defaultDataSet === 'Week' || shiftExpensePieData[0].defaultDataSet === 'Week') {
    combinedExpenses.defaultDataSet = 'Week';
  } else if (expensePieData[0].defaultDataSet === 'Month' || shiftExpensePieData[0].defaultDataSet === 'Month') {
    combinedExpenses.defaultDataSet = 'Month';
  } else if (expensePieData[0].defaultDataSet === 'Quarter' || shiftExpensePieData[0].defaultDataSet === 'Quarter') {
    combinedExpenses.defaultDataSet = 'Quarter';
  } else if (expensePieData[0].defaultDataSet === 'Year' || shiftExpensePieData[0].defaultDataSet === 'Year') {
    combinedExpenses.defaultDataSet = 'Year';
  }

  return combinedExpenses;
};

const getExpenseBarGraphData = async (userId: string) => {
  const startOfWeek: Date = getStartOfWeek();
  const endOfWeek: Date = getEndOfWeek();

  const startOfYear: Date = getStartOfYear();
  const endOfYear: Date = getEndOfYear();

  const startOfMonth: Date = getStartOfMonth();
  const endOfMonth: Date = getEndOfMonth();

  const startOfQuarter: Date = getStartOfQuarter();
  const endOfQuarter: Date = getEndOfQuarter();

  const matchStage: PipelineStage = {
    $match: {
      userId: new Types.ObjectId(userId),
    },
  };

  const addDefaultDataSetField: PipelineStage = {
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

  const dayOfWeekLabel: PipelineStage = {
    $addFields: {
      label: {
        $arrayElemAt: [DAYS_OF_WEEK, { $subtract: ['$dayOfWeek', 1] }],
      },
    },
  };

  const weekOfMonthLabel: PipelineStage = {
    $addFields: {
      label: {
        $concat: ['Week ', { $toString: '$weekOfMonth' }],
      },
    },
  };

  const monthOfYearLabel: PipelineStage = {
    $addFields: {
      label: {
        $arrayElemAt: [MONTHS_OF_YEAR, { $subtract: ['$month', 1] }],
      },
    },
  };

  const replaceRoot: PipelineStage = {
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

  const typeToObject: PipelineStage = {
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

  const expenseGraphData = await Expense.aggregate([
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

  const shiftExpenseGraphData = await Shift.aggregate([
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
                $arrayElemAt: [MONTHS_OF_YEAR, { $subtract: ['$_id.month', 1] }],
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
                $arrayElemAt: [MONTHS_OF_YEAR, { $subtract: ['$_id.month', 1] }],
              },
              type: 'SHIFT',
              shift: 1,
            },
          },
        ],
      },
    },
    addDefaultDataSetField,
  ] as PipelineStage[]).exec();

  const expenseBarGraphSet = expenseGraphData.length > 0 ? (expenseGraphData[0] as GraphSet) : ({} as GraphSet);
  const shiftExpenseBarGraphSet = shiftExpenseGraphData.length > 0 ? (shiftExpenseGraphData[0] as GraphSet) : ({} as GraphSet);

  const mergedExpenseBarGraphSet: GraphSet = mergeDataSets<GraphSet>(expenseBarGraphSet, shiftExpenseBarGraphSet);

  if (expenseBarGraphSet.defaultDataSet === 'Week' || shiftExpenseBarGraphSet.defaultDataSet === 'Week') {
    mergedExpenseBarGraphSet.defaultDataSet = 'Week';
  } else if (expenseBarGraphSet.defaultDataSet === 'Month' || shiftExpenseBarGraphSet.defaultDataSet === 'Month') {
    mergedExpenseBarGraphSet.defaultDataSet = 'Month';
  } else if (expenseBarGraphSet.defaultDataSet === 'Quarter' || shiftExpenseBarGraphSet.defaultDataSet === 'Quarter') {
    mergedExpenseBarGraphSet.defaultDataSet = 'Quarter';
  } else if (expenseBarGraphSet.defaultDataSet === 'Year' || shiftExpenseBarGraphSet.defaultDataSet === 'Year') {
    mergedExpenseBarGraphSet.defaultDataSet = 'Year';
  }
  return { expenseBarGraphSet, shiftExpenseBarGraphSet, mergedExpenseBarGraphSet };
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

const mergeDataSets = <T extends Object>(setOne: T, setTwo: T) => {
  const mergedSets: Partial<{ [K in keyof T]: T[K][] }> = {};

  (['week', 'month', 'quarter', 'year'] as Array<keyof T>).forEach((period) => {
    const set1 = (setOne[period] || []) as Array<T[keyof T]>;
    const set2 = (setTwo[period] || []) as Array<T[keyof T]>;
    mergedSets[period] = [...set1, ...set2];
  });

  return mergedSets as GraphSet;
};
