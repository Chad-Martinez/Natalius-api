import { Request, Response, NextFunction, RequestHandler } from 'express';
import HttpErrorResponse from '../classes/HttpErrorResponse';
import Expense from '../models/Expense';
import { Aggregate, HydratedDocument, PipelineStage, Types, isValidObjectId } from 'mongoose';
import { IExpense } from '../interfaces/Expense.interface';
import { ICustomRequest } from '../interfaces/CustomeRequest.interface';
import dayjs, { Dayjs } from 'dayjs';
import dayOfYear from 'dayjs/plugin/dayOfYear';
import quarterOfYear from 'dayjs/plugin/quarterOfYear';
import { ExpensesByTypeAndPeriod } from '../types/expense-types';
dayjs.extend(dayOfYear);
dayjs.extend(quarterOfYear);

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

  return ytdExpenses.length > 0 ? ytdExpenses[0].total : 0;
};

export const getExpenseGraphData: RequestHandler = async (req: ICustomRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userId } = req;
    const { period } = req.params;

    let queryDate: Dayjs;
    switch (period) {
      case 'week':
        queryDate = dayjs().startOf('week');
        break;
      case 'month':
        queryDate = dayjs().startOf('month');
        break;
      case 'quarter':
        queryDate = dayjs().startOf('quarter');
        break;
      case 'year':
        queryDate = dayjs().startOf('year');
        break;
      default:
        queryDate = dayjs().startOf('week');
        break;
    }

    const pipline: PipelineStage[] = [
      {
        $match: {
          userId: new Types.ObjectId(userId),
          date: {
            $gte: new Date(queryDate.format('MM/DD/YY')),
          },
        },
      },
    ];

    if (period === 'week') {
      pipline.push(
        {
          $project: {
            year: { $year: '$date' },
            month: { $month: '$date' },
            day: { $dayOfMonth: '$date' },
            amount: 1,
            type: 1,
          },
        },
        {
          $group: {
            _id: {
              year: '$year',
              month: '$month',
              day: '$day',
              type: '$type',
            },
            totalAmount: { $sum: '$amount' },
          },
        },
        {
          $sort: {
            '_id.year': 1,
            '_id.month': 1,
            '_id.day': 1,
            '_id.type': 1,
          },
        },
        {
          $project: {
            year: '$_id.year',
            month: '$_id.month',
            day: '$_id.day',
            type: '$_id.type',
            totalAmount: { $round: ['$totalAmount', 2] },
            _id: 0,
          },
        },
      );
    } else {
      pipline.push(
        {
          $project: {
            year: { $year: '$date' },
            month: { $month: '$date' },
            amount: 1,
            type: 1,
          },
        },
        {
          $group: {
            _id: {
              year: '$year',
              month: '$month',
              type: '$type',
            },
            totalAmount: { $sum: '$amount' },
          },
        },
        {
          $sort: {
            '_id.year': 1,
            '_id.month': 1,
            '_id.type': 1,
          },
        },
        {
          $project: {
            year: '$_id.year',
            month: '$_id.month',
            type: '$_id.type',
            totalAmount: { $round: ['$totalAmount', 2] },
            _id: 0,
          },
        },
      );
    }

    const expenses: Aggregate<Array<ExpensesByTypeAndPeriod>>[] = await Expense.aggregate(pipline);

    res.status(200).json(expenses);
  } catch (error) {
    console.error('Expense Controller Error - ExpenseGraphData: ', error);
    next(error);
  }
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
    const { _id, vendorId, date, amount, type, notes } = req.body;

    if (!isValidObjectId(_id)) throw new HttpErrorResponse(400, 'Provided id is not valid');

    const expense: HydratedDocument<IExpense> | null = await Expense.findById(_id);

    if (!expense) throw new HttpErrorResponse(404, 'Requested resource not found');

    expense.vendorId = vendorId;
    expense.date = date;
    expense.amount = amount;
    expense.type = type;
    expense.notes = notes;

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
  getExpensesByUser,
  getPaginatedExpenses,
  getYtdExpenseWidgetData,
  getExpenseGraphData,
  getExpenseById,
  addExpense,
  updateExpense,
  deleteExpense,
};
