import { ObjectId } from 'mongodb';
import { Request, Response, NextFunction } from 'express';
import { HydratedDocument, PipelineStage } from 'mongoose';
import HttpErrorResponse from '../classes/HttpErrorResponse';
import { IIncome } from '../interfaces/Income.interface';
import Income from '../models/Income';

export const getAllIncomeByUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userId } = req.params;

    if (userId === ':userId') throw new HttpErrorResponse(500, 'Missing required paramater');

    const income: HydratedDocument<IIncome>[] = await Income.find({ userId: userId }, { __v: 0 })
      .sort({
        date: 1,
      })
      .populate({
        path: 'gigId',
        select: { name: 1 },
      })
      .populate({
        path: 'shiftId',
        select: { _id: 1 },
      })
      .exec();

    res.status(200).json(income);
  } catch (error) {
    console.error('Income Controller Error - IncomeByUser: ', error);
    next(error);
  }
};

export const getPaginatedIncome = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit } = req.query;
    const { id } = req.params;

    console.log(page, limit, id);
    if (!page || !limit || id === ':id') {
      throw new HttpErrorResponse(500, 'Missing proper query parameters');
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

    const incomeCount = await Income.aggregate(pipline);
    const count: number = incomeCount.length > 0 ? incomeCount[0].count : 0;

    if (count) {
      const income: HydratedDocument<IIncome>[] = await Income.find({ userId: id }, { __v: 0 }, { skip: (+page - 1) * +limit, limit: +limit })
        .sort({
          date: 1,
        })
        .populate({
          path: 'gigId',
          select: { name: 1 },
        })
        .populate({
          path: 'shiftId',
          select: { _id: 1 },
        })
        .exec();

      res.status(200).json({ income, count });
    } else {
      res.status(200).json({ income: [], count });
    }
  } catch (error) {
    console.error('Income Controller Error - PaginatedIncome: ', error);
    next(error);
  }
};

export const getIncomeById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { incomeId } = req.params;

    const income: HydratedDocument<IIncome> | null = await Income.findById(incomeId)
      .populate({
        path: 'gigId',
        select: { name: 1 },
      })
      .populate({
        path: 'shiftId',
        select: { _id: 1 },
      })
      .exec();

    if (!income) throw new HttpErrorResponse(404, 'Requested resource not found');

    res.status(200).json({ message: 'Ok!' });
  } catch (error) {
    console.error('Income Controller Error - IncomeById: ', error);
    next(error);
  }
};

export const addIncome = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { gigId, shiftId, date, amount, type, userId } = req.body;

    const income = new Income({
      gigId,
      shiftId,
      date,
      amount,
      type,
      userId,
    });
    await income.save();

    res.status(201).json({ incomeId: income._id });
  } catch (error) {
    console.error('Income Controller Error - AddIncome: ', error);
    if (error.name === 'ValidationError') {
      const err = new HttpErrorResponse(422, error.message);
      next(err);
    } else {
      next(error);
    }
  }
};

export const updateIncome = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { incomeId, gigId, shiftId, date, amount, type, userId } = req.body;

    const income: HydratedDocument<IIncome> | null = await Income.findById(incomeId);

    if (!income) throw new HttpErrorResponse(404, 'Requested resource not found');

    income.gigId = gigId;
    income.shiftId = shiftId;
    income.date = date;
    income.amount = amount;
    income.type = type;
    income.userId = userId;

    await income.save();

    res.status(200).json({ message: 'Income updated' });
  } catch (error) {
    console.error('Income Controller Error - UpdateIncome: ', error);
    if (error.name === 'ValidationError') {
      const err = new HttpErrorResponse(422, error.message);
      next(err);
    } else {
      next(error);
    }
  }
};

export const deleteIncome = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { incomeId } = req.params;
    await Income.deleteOne({ _id: incomeId });

    res.status(200).json({ message: 'Income deleted' });
  } catch (error) {
    console.error('Income Controller Error - DeleteIncome: ', error);
    next(error);
  }
};

export default {
  getAllIncomeByUser,
  getIncomeById,
  addIncome,
  updateIncome,
  deleteIncome,
};
