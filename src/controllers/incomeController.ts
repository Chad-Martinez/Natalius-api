import { Request, Response, NextFunction } from 'express';
import { HydratedDocument, Types, isValidObjectId } from 'mongoose';
import HttpErrorResponse from '../classes/HttpErrorResponse';
import { IIncome, IIncomePopulated } from '../interfaces/Income.interface';
import Income from '../models/Income';
import { ICustomRequest } from '../interfaces/CustomeRequest.interface';
import Shift from '../models/Shift';
import Sprint from '../models/Sprint';
import { ISprint } from '../interfaces/Sprint.interface';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import { getSprintWidgetData } from './sprintController';
import { IncomeAverages } from '../types/income-types';
dayjs.extend(isBetween);

export const getIncomeDashboardData = async (req: ICustomRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userId } = req;

    if (!userId || !isValidObjectId(userId)) throw new HttpErrorResponse(400, 'Provided id is not valid');
    const sprint: ISprint = await getSprintWidgetData(userId);
    const averages: IncomeAverages = await getIncomeAverageWidgetData(userId);
    const graphData = await getIncomeGraphData(userId);

    res.status(200).json({ sprint, averages, graphData });
  } catch (error) {
    console.error('Income Controller Error - IncomeDashboardData: ', error);
    next(error);
  }
};

export const getIncomeByUser = async (req: ICustomRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userId } = req;

    if (!isValidObjectId(userId)) throw new HttpErrorResponse(400, 'Provided id is not valid');

    const income: HydratedDocument<IIncome | IIncomePopulated>[] = await Income.find({ userId: userId }, { __v: 0 })
      .sort({
        date: 1,
      })
      .populate({
        path: 'clubId',
        select: { name: 1 },
      })
      .exec();

    const mappedIncome = income.map((income: HydratedDocument<IIncome | IIncomePopulated>) => {
      const { _id, clubId, shiftId, date, amount, type, userId, created_at, updated_at } = income as HydratedDocument<IIncomePopulated>;
      return {
        _id,
        club: {
          _id: clubId?._id,
          name: clubId?.name,
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

    const count = await Income.find({ userId }).countDocuments();

    if (count) {
      const income = await Income.aggregate([
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
            from: 'clubs',
            localField: 'clubId',
            foreignField: '_id',
            as: 'clubDetails',
          },
        },
        {
          $unwind: '$clubDetails',
        },
        {
          $lookup: {
            from: 'shifts',
            localField: 'shiftId',
            foreignField: '_id',
            as: 'shiftDetails',
          },
        },
        {
          $addFields: {
            club: '$clubDetails.name',
          },
        },
        {
          $project: {
            _id: 1,
            clubId: 1,
            club: 1,
            shiftId: 1,
            shiftDetails: 1,
            date: 1,
            amount: 1,
            type: 1,
            notes: 1,
          },
        },
      ]);

      res.status(200).json({ income, count, pages: Math.ceil(count / +limit) });
    } else {
      res.status(200).json({ income: [], count });
    }
  } catch (error) {
    console.error('Income Controller Error - PaginatedIncome: ', error);
    next(error);
  }
};

export const getYtdIncomeWidgetData = async (userId: string): Promise<number> => {
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

export const getIncomeGraphData = async (userId: string) => {
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

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const monthsOfYear = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const incomeGraphData = await Income.aggregate([
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
              date: { $gte: startOfWeek, $lte: endOfWeek },
            },
          },
          {
            $group: {
              _id: { $dayOfWeek: '$date' },
              total: { $sum: '$amount' },
            },
          },
          {
            $sort: { _id: 1 },
          },
          {
            $project: {
              _id: 0,
              day: {
                $arrayElemAt: [daysOfWeek, { $subtract: ['$_id', 1] }],
              },
              total: 1,
            },
          },
        ],
        month: [
          {
            $match: {
              date: { $gte: startOfMonth, $lte: endOfMonth },
            },
          },
          {
            $group: {
              _id: {
                year: { $year: '$date' },
                month: { $month: '$date' },
                week: { $week: '$date' },
              },
              total: { $sum: '$amount' },
            },
          },
          {
            $sort: { '_id.year': 1, '_id.month': 1, '_id.week': 1 },
          },
          {
            $project: {
              _id: 0,
              year: '$_id.year',
              month: '$_id.month',
              week: '$_id.week',
              total: 1,
            },
          },
        ],
        quarter: [
          {
            $match: {
              date: { $gte: startOfQuarter, $lte: endOfQuarter },
            },
          },
          {
            $group: {
              _id: { $month: '$date' },
              total: { $sum: '$amount' },
            },
          },
          {
            $sort: { _id: 1 },
          },
          {
            $project: {
              _id: 0,
              month: {
                $arrayElemAt: [monthsOfYear, { $subtract: ['$_id', 1] }],
              },
              total: 1,
            },
          },
        ],
        year: [
          {
            $match: {
              date: { $gte: startOfYear, $lte: endOfYear },
            },
          },
          {
            $group: {
              _id: { $month: '$date' },
              total: { $sum: '$amount' },
            },
          },
          {
            $sort: { _id: 1 },
          },
          {
            $project: {
              _id: 0,
              month: {
                $arrayElemAt: [monthsOfYear, { $subtract: ['$_id', 1] }],
              },
              total: 1,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        week: {
          $map: {
            input: { $range: [0, 7] },
            as: 'dayOffset',
            in: {
              $let: {
                vars: {
                  dayOfWeek: { $mod: [{ $add: ['$$dayOffset', 1] }, 7] },
                  dayName: { $arrayElemAt: [daysOfWeek, { $mod: [{ $add: ['$$dayOffset', 1] }, 7] }] },
                  dailyIncome: {
                    $arrayElemAt: [
                      {
                        $filter: {
                          input: '$week',
                          as: 'dayIncome',
                          cond: { $eq: ['$$dayIncome.day', { $arrayElemAt: [daysOfWeek, { $mod: [{ $add: ['$$dayOffset', 1] }, 7] }] }] },
                        },
                      },
                      0,
                    ],
                  },
                },
                in: {
                  label: '$$dayName',
                  total: { $ifNull: ['$$dailyIncome.total', 0] },
                },
              },
            },
          },
        },
        month: {
          $let: {
            vars: {
              startDate: startOfMonth,
              endDate: endOfMonth,
              weekNumbers: { $range: [0, { $subtract: [{ $week: endOfMonth }, { $week: startOfMonth }] }] },
            },
            in: {
              $map: {
                input: '$$weekNumbers',
                as: 'weekOffset',
                in: {
                  $let: {
                    vars: {
                      weekStart: {
                        $add: ['$$startDate', { $multiply: ['$$weekOffset', 604800000] }],
                      },
                      weekEnd: {
                        $add: ['$$startDate', { $multiply: [{ $add: ['$$weekOffset', 1] }, 604800000] }],
                      },
                      weeklyIncome: {
                        $arrayElemAt: [
                          {
                            $filter: {
                              input: '$month',
                              as: 'weekIncome',
                              cond: { $eq: ['$$weekIncome.week', { $week: { $add: ['$$startDate', { $multiply: ['$$weekOffset', 604800000] }] } }] },
                            },
                          },
                          0,
                        ],
                      },
                    },
                    in: {
                      year: { $year: '$$weekStart' },
                      month: { $month: '$$weekStart' },
                      label: { $concat: ['Week ', { $toString: { $add: ['$$weekOffset', 1] } }] },
                      total: { $ifNull: ['$$weeklyIncome.total', 0] },
                    },
                  },
                },
              },
            },
          },
        },
        quarter: {
          $let: {
            vars: {
              startMonth: startOfQuarter,
              endMonth: endOfQuarter,
              months: { $range: [{ $month: startOfQuarter }, { $add: [{ $month: endOfQuarter }, 1] }] },
            },
            in: {
              $map: {
                input: '$$months',
                as: 'monthOffset',
                in: {
                  $let: {
                    vars: {
                      monthIncome: {
                        $arrayElemAt: [
                          {
                            $filter: {
                              input: '$quarter',
                              as: 'monthIncome',
                              cond: { $eq: ['$$monthIncome.month', { $arrayElemAt: [monthsOfYear, { $subtract: ['$$monthOffset', 1] }] }] },
                            },
                          },
                          0,
                        ],
                      },
                    },
                    in: {
                      label: { $arrayElemAt: [monthsOfYear, { $subtract: ['$$monthOffset', 1] }] },
                      total: { $ifNull: ['$$monthIncome.total', 0] },
                    },
                  },
                },
              },
            },
          },
        },
        year: {
          $let: {
            vars: {
              months: { $range: [1, 13] },
            },
            in: {
              $map: {
                input: '$$months',
                as: 'month',
                in: {
                  $let: {
                    vars: {
                      monthIncome: {
                        $arrayElemAt: [
                          {
                            $filter: {
                              input: '$year',
                              as: 'monthIncome',
                              cond: { $eq: ['$$monthIncome.month', { $arrayElemAt: [monthsOfYear, { $subtract: ['$$month', 1] }] }] },
                            },
                          },
                          0,
                        ],
                      },
                    },
                    in: {
                      label: { $arrayElemAt: [monthsOfYear, { $subtract: ['$$month', 1] }] },
                      total: { $ifNull: ['$$monthIncome.total', 0] },
                    },
                  },
                },
              },
            },
          },
        },
        defaultDataSet: {
          $let: {
            vars: {
              datasets: [
                { name: 'week', data: '$week' },
                { name: 'month', data: '$month' },
                { name: 'quarter', data: '$quarter' },
                { name: 'year', data: '$year' },
              ],
            },
            in: {
              $reduce: {
                input: '$$datasets',
                initialValue: null,
                in: {
                  $cond: {
                    if: {
                      $and: [
                        { $eq: ['$$value', null] },
                        { $gt: [{ $size: { $filter: { input: '$$this.data', as: 'data', cond: { $gt: ['$$data.total', 0] } } } }, 0] },
                      ],
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

  return incomeGraphData.length > 0 ? incomeGraphData[0] : null;
};

export const getIncomeById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { incomeId } = req.params;

    if (!isValidObjectId(incomeId)) throw new HttpErrorResponse(400, 'Provided id is not valid');

    const income: HydratedDocument<IIncome | IIncomePopulated> | null = (await Income.findById(incomeId)
      .populate({
        path: 'clubId',
        select: { name: 1 },
      })
      .exec()) as HydratedDocument<IIncomePopulated>;

    if (!income) throw new HttpErrorResponse(404, 'Requested resource not found');

    const { _id, clubId, shiftId, date, amount, type, userId, created_at, updated_at } = income;

    const mappedIncome = {
      _id,
      club: {
        _id: clubId?._id,
        name: clubId?.name,
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

export const getIncomeAverageWidgetData = async (userId: string): Promise<IncomeAverages> => {
  const averages: IncomeAverages[] = await Income.aggregate([
    {
      $match: {
        userId: new Types.ObjectId(userId),
      },
    },
    {
      $group: {
        _id: null,
        totalAmount: { $sum: '$amount' },
        count: { $sum: 1 },
        firstDate: { $min: '$date' },
        lastDate: { $max: '$date' },
      },
    },
    {
      $addFields: {
        daysDiff: {
          $dateDiff: {
            startDate: '$firstDate',
            endDate: '$lastDate',
            unit: 'day',
          },
        },
        weeksDiff: {
          $dateDiff: {
            startDate: '$firstDate',
            endDate: '$lastDate',
            unit: 'week',
          },
        },
        monthsDiff: {
          $dateDiff: {
            startDate: '$firstDate',
            endDate: '$lastDate',
            unit: 'month',
          },
        },
        quartersDiff: {
          $divide: [
            {
              $dateDiff: {
                startDate: '$firstDate',
                endDate: '$lastDate',
                unit: 'month',
              },
            },
            3,
          ],
        },
        yearsDiff: {
          $dateDiff: {
            startDate: '$firstDate',
            endDate: '$lastDate',
            unit: 'year',
          },
        },
      },
    },
    {
      $project: {
        _id: 0,
        daily: {
          $cond: {
            if: { $eq: ['$daysDiff', 0] },
            then: null,
            else: { $round: [{ $divide: ['$totalAmount', '$daysDiff'] }, 0] },
          },
        },
        weekly: {
          $cond: {
            if: { $eq: ['$weeksDiff', 0] },
            then: null,
            else: { $round: [{ $divide: ['$totalAmount', '$weeksDiff'] }, 0] },
          },
        },
        monthly: {
          $cond: {
            if: { $eq: ['$monthsDiff', 0] },
            then: null,
            else: { $round: [{ $divide: ['$totalAmount', '$monthsDiff'] }, 0] },
          },
        },
        quarterly: {
          $cond: {
            if: { $eq: ['$quartersDiff', 0] },
            then: null,
            else: { $round: [{ $divide: ['$totalAmount', '$quartersDiff'] }, 0] },
          },
        },
        yearly: {
          $cond: {
            if: { $eq: ['$yearsDiff', 0] },
            then: null,
            else: { $round: [{ $divide: ['$totalAmount', '$yearsDiff'] }, 0] },
          },
        },
      },
    },
  ]).exec();

  return averages[0];
};

export const addIncome = async (req: ICustomRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { clubId, shiftId, date, amount, type } = req.body;

    const { userId } = req;

    const income = new Income({
      clubId,
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

    const sprint: HydratedDocument<ISprint> | null = await Sprint.findOne({ userId: userId, isCompleted: false });

    if (sprint && dayjs(date).isBetween(sprint.start, sprint.end, null, '[]')) {
      sprint.incomes.push(income._id);
      await sprint.save();
    }

    res.status(201).json({ incomeId: income._id, message: 'Income added' });
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
  const { _id } = req.body;

  try {
    if (!isValidObjectId(_id)) throw new HttpErrorResponse(400, 'Provided id is not valid');

    const income: HydratedDocument<IIncome> | null = await Income.findById(_id);

    if (!income) throw new HttpErrorResponse(404, 'Requested resource not found');

    delete req.body._id;

    const updates = Object.keys(req.body);
    console.log(updates);

    updates.forEach((update: string) => {
      // @ts-ignore
      income[update] = req.body[update];
    });

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

    const income = await Income.findById(incomeId);

    if (!income) throw new HttpErrorResponse(404, 'Requested resource not found');

    if (income.shiftId) {
      const shift = await Shift.findById(income.shiftId);
      if (shift) {
        shift.incomeReported = false;
        await shift.save();
      }
    }

    await Income.deleteOne({ _id: incomeId });

    const sprint: HydratedDocument<ISprint> | null = await Sprint.findOne({ userId: income.userId });

    if (sprint) {
      sprint.incomes = sprint.incomes.filter((incomeId: Types.ObjectId) => incomeId !== income._id);
      await sprint.save();
    }

    res.status(200).json({ message: 'Income deleted' });
  } catch (error) {
    console.error('Income Controller Error - DeleteIncome: ', error);
    next(error);
  }
};

export default {
  getIncomeDashboardData,
  getIncomeByUser,
  getPaginatedIncome,
  getYtdIncomeWidgetData,
  getIncomeById,
  getIncomeAverageWidgetData,
  addIncome,
  updateIncome,
  deleteIncome,
};
