import { Response, NextFunction } from 'express';
// import { IShift } from '../interfaces/Shift.interface';
// import Shift from '../models/Shift';
// import { HydratedDocument, Types } from 'mongoose';
import { ICustomRequest } from '../interfaces/CustomeRequest.interface';
// import Income from '../models/Income';
// import dayjs from 'dayjs';
// import Expense from '../models/Expense';
import HttpErrorResponse from '../classes/HttpErrorResponse';
// import { ISprint } from '../interfaces/Sprint.interface';
// import Sprint from '../models/Sprint';
import { getShiftWidgetData } from './shiftController';
import { getYtdIncomeWidgetData } from './incomeController';
import { getYtdExpenseWidgetData } from './expenseController';
import { getSprintWidgetData } from './sprintController';

export const getDashboardData = async (req: ICustomRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userId } = req;
    if (!userId) throw new HttpErrorResponse(404, 'Requested resource not found');

    const upcomingShifts = await getShiftWidgetData(userId);
    const ytdIncome = await getYtdIncomeWidgetData(userId);
    const ytdExpenses = await getYtdExpenseWidgetData(userId);
    const sprint = await getSprintWidgetData(userId);

    res.status(200).json({ sprint, upcomingShifts, ytdIncome, ytdExpenses });
  } catch (error) {
    console.error('Dashboard Controller Error: ', error);
    next(error);
  }
};

// const getActiveSprint = async (userId: string): Promise<HydratedDocument<ISprint>> => {
//   const sprint: HydratedDocument<ISprint>[] = await Sprint.aggregate([
//     {
//       $match: {
//         userId: new Types.ObjectId(userId),
//         isCompleted: false,
//       },
//     },
//     {
//       $lookup: {
//         from: 'incomes',
//         localField: 'incomes',
//         foreignField: '_id',
//         as: 'incomeDetails',
//       },
//     },
//     {
//       $addFields: {
//         progress: { $sum: '$incomeDetails.amount' },
//         timeLeft: {
//           $divide: [{ $subtract: ['$end', new Date()] }, 1000 * 60 * 60 * 24],
//         },
//       },
//     },
//     {
//       $project: {
//         _id: 1,
//         start: 1,
//         end: 1,
//         goal: 1,
//         progress: 1,
//         timeLeft: 1,
//       },
//     },
//   ]).exec();
//   return sprint[0];
// };

// const getUpcomingShifts = async (userId: string): Promise<HydratedDocument<IShift>[] | void> => {
//   try {
//     const today = new Date();
//     today.setHours(0, 0, 0, 0);

//     const shifts: HydratedDocument<IShift>[] = await Shift.aggregate([
//       {
//         $match: {
//           userId: new Types.ObjectId(userId),
//           start: { $gte: today },
//         },
//       },
//       {
//         $sort: {
//           start: 1,
//         },
//       },
//       {
//         $limit: 3,
//       },
//       {
//         $lookup: {
//           from: 'gigs',
//           localField: 'gigId',
//           foreignField: '_id',
//           as: 'gigDetails',
//         },
//       },
//       {
//         $unwind: '$gigDetails',
//       },
//       {
//         $project: {
//           _id: 1,
//           gigId: 1,
//           gigDetails: 1,
//           start: 1,
//           end: 1,
//           notes: 1,
//           incomeReported: 1,
//         },
//       },
//     ]).exec();

//     return shifts;
//   } catch (error) {
//     console.error('Get Next Three Shifts Error: ', error);
//   }
// };

// const getYTDIncome = async (userId: string): Promise<number> => {
//   const ytdIncome = await Income.aggregate([
//     {
//       $match: {
//         userId: new Types.ObjectId(userId),
//         date: {
//           $gte: new Date(dayjs().startOf('year').format('MM/DD/YY')),
//         },
//       },
//     },
//     {
//       $group: {
//         _id: null,
//         total: { $sum: '$amount' },
//       },
//     },
//   ]).exec();

//   return ytdIncome.length > 0 ? ytdIncome[0].total : 0;
// };

// const getYTDExpenses = async (userId: string): Promise<number> => {
//   const ytdExpenses = await Expense.aggregate([
//     {
//       $match: {
//         userId: new Types.ObjectId(userId),
//         date: {
//           $gte: new Date(dayjs().startOf('year').format('MM/DD/YY')),
//         },
//       },
//     },
//     {
//       $group: {
//         _id: null,
//         total: { $sum: '$amount' },
//       },
//     },
//   ]).exec();

//   return ytdExpenses.length > 0 ? ytdExpenses[0].total : 0;
// };
