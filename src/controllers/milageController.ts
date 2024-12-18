import Shift from '../models/Shift';
import HttpErrorResponse from '../classes/HttpErrorResponse';
import { Types } from 'mongoose';
import Expense from '../models/Expense';
import { getStartOfYear } from '../helpers/date-time-helpers';

export const getYtdMilage = async (userId: string) => {
  try {
    console.log('id ', userId);
    const shiftMilage = await Shift.aggregate([
      {
        $match: {
          userId: new Types.ObjectId(userId),
          shiftComplete: true,
          start: {
            $gte: getStartOfYear(),
          },
        },
      },

      {
        $group: {
          _id: null,
          totalMilage: { $sum: '$milage' },
        },
      },
    ]).exec();

    const expenseMilage = await Expense.aggregate([
      {
        $match: {
          userId: new Types.ObjectId(userId),
          date: { $gte: getStartOfYear() },
        },
      },
      {
        $group: {
          _id: null,
          totalMilage: { $sum: '$milage' },
        },
      },
    ]);

    const totalMilage =
      (shiftMilage[0]?.totalMilage ? shiftMilage[0].totalMilage : 0) + (expenseMilage[0]?.totalMilage ? expenseMilage[0].totalMilage : 0);

    return totalMilage;
  } catch (error) {
    console.error('Milage Controller - YTD Milage Error ', error);
    throw new HttpErrorResponse(500, 'Internal Server Error');
  }
};
