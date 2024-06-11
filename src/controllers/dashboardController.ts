import { Response, NextFunction } from 'express';
import { IShift } from '../interfaces/Shift.interface';
import Shift from '../models/Shift';
import { HydratedDocument, Types } from 'mongoose';
import { ICustomRequest } from '../interfaces/CustomeRequest.interface';
import Income from '../models/Income';
import dayjs from 'dayjs';
import Expense from '../models/Expense';
import HttpErrorResponse from '../classes/HttpErrorResponse';

export const getDashboardData = async (req: ICustomRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userId } = req;
    if (!userId) throw new HttpErrorResponse(404, 'Requested resource not found');

    const upcomingShifts = await getUpcomingShifts(userId);
    const ytdIncome = await getYTDIncome(userId);
    const ytdExpenses = await getYTDExpenses(userId);

    res.status(200).json({ upcomingShifts, ytdIncome, ytdExpenses });
  } catch (error) {
    console.error('Dashboard Controller Error: ', error);
    next(error);
  }
};

const getUpcomingShifts = async (userId: string): Promise<HydratedDocument<IShift>[] | void> => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const shifts: HydratedDocument<IShift>[] = await Shift.aggregate([
      {
        $match: {
          userId: new Types.ObjectId(userId),
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
  } catch (error) {
    console.error('Get Next Three Shifts Error: ', error);
  }
};

const getYTDIncome = async (userId: string): Promise<number> => {
  const ytdIncome = await Income.aggregate([
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

  return ytdIncome.length > 0 ? ytdIncome[0].total : 0;
};

const getYTDExpenses = async (userId: string): Promise<number> => {
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
