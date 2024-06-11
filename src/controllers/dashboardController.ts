import { Response, NextFunction } from 'express';
import { IShift } from '../interfaces/Shift.interface';
import Shift from '../models/Shift';
import { HydratedDocument, Types } from 'mongoose';
import { ICustomRequest } from '../interfaces/CustomeRequest.interface';

export const getUpcomingShifts = async (req: ICustomRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userId } = req;
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

    res.status(200).json(shifts);
  } catch (error) {
    console.error('Get Next Three Shifts Error: ', error);
    next(error);
  }
};
