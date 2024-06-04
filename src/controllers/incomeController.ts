import { ObjectId } from 'mongodb';
import { Request, Response, NextFunction } from 'express';
import { HydratedDocument, PipelineStage, isValidObjectId } from 'mongoose';
import HttpErrorResponse from '../classes/HttpErrorResponse';
import { IIncome, IIncomePopulated } from '../interfaces/Income.interface';
import Income from '../models/Income';
import { ICustomRequest } from '../interfaces/CustomeRequest.interface';
import Shift from '../models/Shift';

export const getIncomeByUser = async (req: ICustomRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userId } = req;

    if (!isValidObjectId(userId)) throw new HttpErrorResponse(400, 'Provided id is not valid');

    const income: HydratedDocument<IIncome | IIncomePopulated>[] = await Income.find({ userId: userId }, { __v: 0 })
      .sort({
        date: 1,
      })
      .populate({
        path: 'gigId',
        select: { name: 1 },
      })
      .exec();

    const mappedIncome = income.map((income: HydratedDocument<IIncome | IIncomePopulated>) => {
      const { _id, gigId, shiftId, date, amount, type, userId, created_at, updated_at } = income as HydratedDocument<IIncomePopulated>;
      return {
        _id,
        gig: {
          _id: gigId?._id,
          name: gigId?.name,
        },
        shiftId,
        date,
        amount,
        type,
        userId,
        created_at,
        updated_at,
      };
    });

    res.status(200).json({ income: mappedIncome });
  } catch (error) {
    console.error('Income Controller Error - IncomeByUser: ', error);
    next(error);
  }
};

export const getPaginatedIncome = async (req: ICustomRequest, res: Response, next: NextFunction) => {
  try {
    const { page, limit } = req.query;
    const { userId } = req;

    if (!isValidObjectId(userId)) throw new HttpErrorResponse(400, 'Provided id is not valid');

    if (!page || !limit) {
      throw new HttpErrorResponse(400, 'Missing proper query parameters');
    }

    const pipline: PipelineStage[] = [
      {
        $match: {
          userId: new ObjectId(userId),
        },
      },
      {
        $count: 'count',
      },
    ];

    const incomeCount = await Income.aggregate(pipline);
    const count: number = incomeCount.length > 0 ? incomeCount[0].count : 0;

    if (count) {
      const income: HydratedDocument<IIncome | IIncomePopulated>[] = await Income.find(
        { userId },
        { __v: 0 },
        { skip: (+page - 1) * +limit, limit: +limit },
      )
        .sort({
          date: 1,
        })
        .populate({
          path: 'gigId',
          select: { name: 1 },
        })
        .exec();

      const mappedIncome = income.map((income: HydratedDocument<IIncome | IIncomePopulated>) => {
        const { _id, gigId, shiftId, date, amount, type, userId, created_at, updated_at } = income as HydratedDocument<IIncomePopulated>;
        return {
          _id,
          gig: {
            _id: gigId?._id,
            name: gigId?.name,
          },
          shiftId,
          date,
          amount,
          type,
          userId,
          created_at,
          updated_at,
        };
      });

      res.status(200).json({ income: mappedIncome, count });
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

    if (!isValidObjectId(incomeId)) throw new HttpErrorResponse(400, 'Provided id is not valid');

    const income: HydratedDocument<IIncome | IIncomePopulated> | null = (await Income.findById(incomeId)
      .populate({
        path: 'gigId',
        select: { name: 1 },
      })
      .exec()) as HydratedDocument<IIncomePopulated>;

    if (!income) throw new HttpErrorResponse(404, 'Requested resource not found');

    const { _id, gigId, shiftId, date, amount, type, userId, created_at, updated_at } = income;

    const mappedIncome = {
      _id,
      gig: {
        _id: gigId?._id,
        name: gigId?.name,
      },
      shiftId,
      date,
      amount,
      type,
      userId,
      created_at,
      updated_at,
    };

    res.status(200).json({ income: mappedIncome });
  } catch (error) {
    console.error('Income Controller Error - IncomeById: ', error);
    next(error);
  }
};

export const addIncome = async (req: ICustomRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { gigId, shiftId, date, amount, type } = req.body;

    const { userId } = req;

    const income = new Income({
      gigId,
      shiftId,
      date,
      amount,
      type,
      userId,
    });
    await income.save();

    if (shiftId) {
      const shift = await Shift.findById(shiftId);

      if (shift) {
        shift.incomeReported = true;
        await shift.save();
      }
    }

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
    const { incomeId, gigId, shiftId, date, amount, type } = req.body;

    if (!isValidObjectId(incomeId)) throw new HttpErrorResponse(400, 'Provided id is not valid');

    const income: HydratedDocument<IIncome> | null = await Income.findById(incomeId);

    if (!income) throw new HttpErrorResponse(404, 'Requested resource not found');

    income.gigId = gigId;
    income.shiftId = shiftId;
    income.date = date;
    income.amount = amount;
    income.type = type;

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

    if (!isValidObjectId(incomeId)) throw new HttpErrorResponse(400, 'Provided id is not valid');

    await Income.deleteOne({ _id: incomeId });

    res.status(200).json({ message: 'Income deleted' });
  } catch (error) {
    console.error('Income Controller Error - DeleteIncome: ', error);
    next(error);
  }
};

export default {
  getIncomeByUser,
  getIncomeById,
  addIncome,
  updateIncome,
  deleteIncome,
};
