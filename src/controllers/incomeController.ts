import { Response, NextFunction } from 'express';
import { Types, isValidObjectId } from 'mongoose';
import HttpErrorResponse from '../classes/HttpErrorResponse';
import { ICustomRequest } from '../interfaces/CustomeRequest.interface';
import Shift from '../models/Shift';
import { ISprint } from '../interfaces/Sprint.interface';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import { getSprintWidgetData } from './sprintController';
import { IncomeAverages } from '../types/income-types';
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

export const getPaginatedIncome = async (req: ICustomRequest, res: Response, next: NextFunction) => {
  try {
    const { page, limit } = req.query;
    const { userId } = req;

    if (!isValidObjectId(userId)) throw new HttpErrorResponse(400, 'Provided id is not valid');

    if (!page || !limit) {
      throw new HttpErrorResponse(400, 'Missing proper query parameters');
    }

    const count = await Shift.find({ userId }).countDocuments();

    if (count) {
      const shiftIncome = await Shift.aggregate([
        {
          $match: {
            userId: new Types.ObjectId(userId),
          },
        },
        {
          $sort: {
            start: -1,
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
          $addFields: {
            club: '$clubDetails.name',
          },
        },
        {
          $match: {
            'income.amount': { $gt: 0 },
          },
        },
        {
          $project: {
            _id: 1,
            clubId: 1,
            club: 1,
            start: 1,
            end: 1,
            shiftComplete: 1,
            notes: 1,
            expenses: 1,
            income: 1,
            milage: 1,
          },
        },
      ]);

      res.status(200).json({ shiftIncome, count, pages: Math.ceil(count / +limit) });
    } else {
      res.status(200).json({ shiftIncome: [], count });
    }
  } catch (error) {
    console.error('Income Controller Error - PaginatedIncome: ', error);
    next(error);
  }
};

export const getYtdIncomeWidgetData = async (userId: string): Promise<number> => {
  const ytdIncome = await Shift.aggregate([
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
        total: { $sum: '$income.amount' },
      },
    },
  ]).exec();

  return ytdIncome.length > 0 ? ytdIncome[0].total : 0;
};

export const getIncomeGraphData = async (userId: string) => {
  const startOfWeek: Date = getStartOfWeek();
  const endOfWeek: Date = getEndOfWeek();

  const startOfYear: Date = getStartOfYear();
  const endOfYear: Date = getEndOfYear();

  const startOfMonth: Date = getStartOfMonth();
  const endOfMonth: Date = getEndOfMonth();

  const startOfQuarter: Date = getStartOfQuarter();
  const endOfQuarter: Date = getEndOfQuarter();

  const incomeGraphData = await Shift.aggregate([
    {
      $match: {
        userId: new Types.ObjectId(userId),
        start: { $gte: startOfYear, $lt: endOfYear },
      },
    },
    {
      $facet: {
        week: [
          {
            $match: {
              start: { $gte: startOfWeek, $lte: endOfWeek },
            },
          },
          {
            $group: {
              _id: { $dayOfWeek: '$start' },
              total: { $sum: '$income.amount' },
            },
          },
          {
            $sort: { _id: 1 },
          },
          {
            $project: {
              _id: 0,
              day: { $arrayElemAt: [DAYS_OF_WEEK, { $subtract: ['$_id', 1] }] },
              total: 1,
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
            $group: {
              _id: {
                year: { $year: '$start' },
                month: { $month: '$start' },
                week: { $week: '$start' },
              },
              total: { $sum: '$income.amount' },
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
              start: { $gte: startOfQuarter, $lte: endOfQuarter },
            },
          },
          {
            $group: {
              _id: { $month: '$start' },
              total: { $sum: '$income.amount' },
            },
          },
          {
            $sort: { _id: 1 },
          },
          {
            $project: {
              _id: 0,
              month: { $arrayElemAt: [MONTHS_OF_YEAR, { $subtract: ['$_id', 1] }] },
              total: 1,
            },
          },
        ],
        year: [
          {
            $group: {
              _id: { $month: '$start' },
              total: { $sum: '$income.amount' },
            },
          },
          {
            $sort: { _id: 1 },
          },
          {
            $project: {
              _id: 0,
              month: { $arrayElemAt: [MONTHS_OF_YEAR, { $subtract: ['$_id', 1] }] },
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
                  dayName: { $arrayElemAt: [DAYS_OF_WEEK, '$$dayOffset'] },
                  dailyIncome: {
                    $arrayElemAt: [
                      {
                        $filter: {
                          input: '$week',
                          as: 'dayIncome',
                          cond: { $eq: ['$$dayIncome.day', { $arrayElemAt: [DAYS_OF_WEEK, '$$dayOffset'] }] },
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
                              cond: { $eq: ['$$monthIncome.month', { $arrayElemAt: [MONTHS_OF_YEAR, { $subtract: ['$$monthOffset', 1] }] }] },
                            },
                          },
                          0,
                        ],
                      },
                    },
                    in: {
                      label: { $arrayElemAt: [MONTHS_OF_YEAR, { $subtract: ['$$monthOffset', 1] }] },
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
                              cond: { $eq: ['$$monthIncome.month', { $arrayElemAt: [MONTHS_OF_YEAR, { $subtract: ['$$month', 1] }] }] },
                            },
                          },
                          0,
                        ],
                      },
                    },
                    in: {
                      label: { $arrayElemAt: [MONTHS_OF_YEAR, { $subtract: ['$$month', 1] }] },
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
  ]);

  const result = incomeGraphData[0];

  ['week', 'month', 'quarter', 'year'].forEach((period) => {
    if (!result[period] || result[period].length === 0) {
      result[period] = [];
    }
  });

  return result;
};

export const getIncomeAverageWidgetData = async (userId: string): Promise<IncomeAverages> => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const startOfCurrentYear = new Date(currentYear, 0, 1);
  const endOfCurrentYear = new Date(currentYear + 1, 0, 1);

  const result = await Shift.aggregate([
    {
      $match: {
        userId: new Types.ObjectId(userId),
        start: {
          $gte: startOfCurrentYear,
          $lte: endOfCurrentYear,
        },
      },
    },
    {
      $project: {
        incomeAmount: '$income.amount',
        week: { $dateTrunc: { date: '$start', unit: 'week', binSize: 1 } },
        month: { $dateTrunc: { date: '$start', unit: 'month', binSize: 1 } },
      },
    },
    {
      $facet: {
        averageIncomePerShift: [
          {
            $group: {
              _id: null,
              averageIncome: { $avg: '$incomeAmount' },
            },
          },
        ],
        weeklyAverages: [
          {
            $group: {
              _id: '$week',
              totalIncomePerWeek: { $sum: '$incomeAmount' },
            },
          },
          {
            $group: {
              _id: null,
              totalWeeksWithData: { $sum: 1 },
              averageIncomePerWeek: { $avg: '$totalIncomePerWeek' },
            },
          },
        ],
        monthlyAverages: [
          {
            $group: {
              _id: '$month',
              totalIncomePerMonth: { $sum: '$incomeAmount' },
            },
          },
          {
            $group: {
              _id: null,
              totalMonthsWithData: { $sum: 1 },
              averageIncomePerMonth: { $avg: '$totalIncomePerMonth' },
            },
          },
        ],
        totalIncomeForYear: [
          {
            $group: {
              _id: null,
              totalIncome: { $sum: '$incomeAmount' },
            },
          },
        ],
      },
    },
    {
      $project: {
        _id: 0,
        perShift: { $arrayElemAt: ['$averageIncomePerShift.averageIncome', 0] },
        perWeek: { $arrayElemAt: ['$weeklyAverages.averageIncomePerWeek', 0] },
        perMonth: { $arrayElemAt: ['$monthlyAverages.averageIncomePerMonth', 0] },
        perYear: { $arrayElemAt: ['$totalIncomeForYear.totalIncome', 0] },
      },
    },
  ]);

  return result[0];
};

export default {
  getIncomeDashboardData,
  getPaginatedIncome,
  getYtdIncomeWidgetData,
  getIncomeAverageWidgetData,
};
