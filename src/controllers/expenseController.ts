import { ObjectId } from 'mongodb';
import { Request, Response, NextFunction } from 'express';
import HttpErrorResponse from '../classes/HttpErrorResponse';
import Expense from '../models/Expense';
import { HydratedDocument, PipelineStage, isValidObjectId } from 'mongoose';
import { IExpense } from 'src/interfaces/Expense.interface';

export const getExpensesByUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userId } = req.params;

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

export const getPaginatedExpenses = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit } = req.query;
    const { id } = req.params;

    if (!isValidObjectId(id)) throw new HttpErrorResponse(400, 'Provided id is not valid');

    if (!page || !limit) {
      throw new HttpErrorResponse(400, 'Missing proper query parameters');
    }

    const pipline: PipelineStage[] = [
      {
        $match: {
          userId: new ObjectId(id),
        },
      },
      {
        $count: 'count',
      },
    ];

    const incomeCount = await Expense.aggregate(pipline);
    const count: number = incomeCount.length > 0 ? incomeCount[0].count : 0;

    if (count) {
      const income: HydratedDocument<IExpense>[] = await Expense.find({ userId: id }, { __v: 0 }, { skip: (+page - 1) * +limit, limit: +limit })
        .sort({
          date: 1,
        })
        .populate({
          path: 'vendorId',
          select: { name: 1, defaultType: 1 },
        })
        .exec();

      res.status(200).json({ income, count });
    } else {
      res.status(200).json({ income: [], count });
    }
  } catch (error) {
    console.error('Expense Controller Error - PaginatedExpenses: ', error);
    next(error);
  }
};

export const getExpenseById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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

export const addExpense = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { vendorId, date, amount, type, distance, userId } = req.body;

    const expense = new Expense({
      vendorId,
      date,
      amount,
      type,
      distance,
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

export const updateExpense = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { _id, vendorId, date, amount, type, distance, userId } = req.body;

    if (!isValidObjectId(_id)) throw new HttpErrorResponse(400, 'Provided id is not valid');

    const expense: HydratedDocument<IExpense> | null = await Expense.findById(_id);

    if (!expense) throw new HttpErrorResponse(404, 'Requested resource not found');

    expense.vendorId = vendorId;
    expense.date = date;
    expense.amount = amount;
    expense.type = type;
    expense.distance = distance;
    expense.userId = userId;

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

export const deleteExpense = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { _id } = req.params;

    if (!isValidObjectId(_id)) {
      throw new HttpErrorResponse(400, 'Provided id is not valid');
    }

    await Expense.deleteOne({ _id: _id });

    res.status(200).json({ message: 'Income deleted' });
  } catch (error) {
    console.error('Expense Controller Error - DeleteExpense: ', error);
    next(error);
  }
};

export default {
  getExpensesByUser,
  getPaginatedExpenses,
  getExpenseById,
  addExpense,
  updateExpense,
  deleteExpense,
};
