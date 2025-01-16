import { Response, NextFunction } from 'express';
import { HydratedDocument, Types, isValidObjectId } from 'mongoose';
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
  getQuarterMonths,
  getStartOfDay,
  getStartOfMonth,
  getStartOfQuarter,
  getStartOfWeek,
  getStartOfYear,
  MONTHS_OF_YEAR,
} from '../helpers/date-time-helpers';
import { IShift } from '../interfaces/Shift.interface';
import { fillMissingPeriods, findFirstNonZeroIncomeProperty, getWeeksInMonth } from '../helpers/graph-helpers';
dayjs.extend(isBetween);

export const getIncomeDashboardData = async (req: ICustomRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userId } = req;

    if (!userId || !isValidObjectId(userId)) throw new HttpErrorResponse(400, 'Provided id is not valid');
    const sprint: ISprint = await getSprintWidgetData(userId);
    const averages: IncomeAverages = await getIncomeAverageWidgetData(userId);
    const graphData = await getIncomeGraphData(userId);
    const shiftPrediction = await perdictNextShiftIncome(userId);

    res.status(200).json({ sprint, averages, graphData, shiftPrediction });
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
          $gte: getStartOfYear(),
        },
      },
    },
    {
      $group: {
        _id: null,
        income: { $sum: '$income.amount' },
      },
    },
  ]).exec();

  return ytdIncome.length > 0 ? ytdIncome[0].income : 0;
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
  try {
    const weekIncomeGraphData = await Shift.aggregate([
      {
        $match: {
          userId: new Types.ObjectId(userId),
          shiftComplete: true,
          start: { $gte: startOfWeek, $lt: endOfWeek },
        },
      },
      {
        $group: {
          _id: { $dayOfWeek: '$start' },
          income: { $sum: '$income.amount' },
        },
      },
      {
        $sort: { _id: 1 },
      },
      {
        $addFields: {
          day: { $arrayElemAt: [DAYS_OF_WEEK, { $subtract: ['$_id', 1] }] },
        },
      },
      {
        $group: {
          _id: null,
          week: { $push: { day: '$day', income: '$income' } },
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
                    income: { $ifNull: ['$$dailyIncome.income', 0] },
                  },
                },
              },
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          week: 1,
        },
      },
    ]);

    const monthIncomeGraphData = await Shift.aggregate([
      {
        $match: {
          userId: new Types.ObjectId(userId),
          shiftComplete: true,
          start: { $gte: startOfMonth, $lt: endOfMonth },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$start' },
            week: { $week: '$start' },
          },
          income: { $sum: '$income.amount' },
        },
      },
      {
        $sort: { '_id.year': 1, '_id.week': 1 },
      },
      {
        $project: {
          _id: 0,
          year: '$_id.year',
          week: '$_id.week',
          income: 1,
        },
      },
    ]);

    const formatMonthData = getWeeksInMonth(startOfMonth, endOfMonth, monthIncomeGraphData);

    const quarterIncomeGraphData = await Shift.aggregate([
      {
        $match: {
          userId: new Types.ObjectId(userId),
          shiftComplete: true,
          start: { $gte: startOfQuarter, $lt: endOfQuarter },
        },
      },
      {
        $group: {
          _id: { $month: '$start' },
          income: { $sum: '$income.amount' },
        },
      },
      {
        $sort: { _id: 1 },
      },
      {
        $project: {
          _id: 0,
          label: { $arrayElemAt: [MONTHS_OF_YEAR, { $subtract: ['$_id', 1] }] },
          income: 1,
        },
      },
    ]);

    const formatQuarterData = fillMissingPeriods(quarterIncomeGraphData, getQuarterMonths());

    const yearIncomeGraphData = await Shift.aggregate([
      {
        $match: {
          userId: new Types.ObjectId(userId),
          shiftComplete: true,
          start: { $gte: startOfYear, $lt: endOfYear },
        },
      },
      {
        $group: {
          _id: { $month: '$start' },
          income: { $sum: '$income.amount' },
        },
      },
      {
        $sort: { _id: 1 },
      },
      {
        $project: {
          _id: 0,
          label: { $arrayElemAt: [MONTHS_OF_YEAR, { $subtract: ['$_id', 1] }] },
          income: 1,
        },
      },
    ]);

    const formatYearData = fillMissingPeriods(yearIncomeGraphData, MONTHS_OF_YEAR);

    const ytdGraphData = {
      week: weekIncomeGraphData[0]?.week ? weekIncomeGraphData[0].week : [],
      month: formatMonthData,
      quarter: formatQuarterData,
      year: formatYearData,
    };

    const defaultDataSet = findFirstNonZeroIncomeProperty(ytdGraphData);

    return { ...ytdGraphData, defaultDataSet };
  } catch (error) {
    console.log('Income Controller Error - getIncomeGraphData: ', error);
    return {};
  }
};

export const getIncomeAverageWidgetData = async (userId: string): Promise<IncomeAverages> => {
  try {
    const result = await Shift.aggregate([
      {
        $match: {
          userId: new Types.ObjectId(userId),
          start: {
            $gte: getStartOfYear(),
            $lte: getEndOfYear(),
          },
          shiftComplete: true,
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

    console.log;

    return result[0];
  } catch (error) {
    console.log('Error in getIncomeAverageWidgetData', error);
    return {} as IncomeAverages;
  }
};

export const perdictNextShiftIncome = async (
  userId: string,
): Promise<{ prediction: number; nextShift: { start: Date; timezone: String } } | null> => {
  const nextShift: HydratedDocument<IShift> | null = await Shift.findOne({
    userId: new Types.ObjectId(userId),
    shiftComplete: false,
    start: { $gte: getStartOfDay() },
    end: { $gte: new Date(dayjs().add(1, 'hour').format()) },
  }).sort({ start: 1 });

  if (!nextShift) {
    return null;
  }

  const dayOfWeek = dayjs.utc(nextShift.start).day() + 1;

  const result = await Shift.aggregate([
    {
      $match: {
        userId: new Types.ObjectId(userId),
        shiftComplete: true,
      },
    },
    {
      $project: {
        incomeAmount: '$income.amount',
        dayOfWeek: { $dayOfWeek: '$start' },
      },
    },
    {
      $match: {
        dayOfWeek: dayOfWeek,
      },
    },
    { $sort: { incomeAmount: 1 } },
    {
      $group: {
        _id: '$userId',
        incomeArray: { $push: '$incomeAmount' },
      },
    },
    {
      $project: {
        incomeMedian: {
          $let: {
            vars: { count: { $size: '$incomeArray' } },
            in: {
              $cond: [
                { $eq: [{ $mod: ['$$count', 2] }, 0] },
                {
                  $avg: [
                    { $arrayElemAt: ['$incomeArray', { $subtract: [{ $divide: ['$$count', 2] }, 1] }] },
                    { $arrayElemAt: ['$incomeArray', { $divide: ['$$count', 2] }] },
                  ],
                },
                {
                  $arrayElemAt: ['$incomeArray', { $floor: { $divide: ['$$count', 2] } }],
                },
              ],
            },
          },
        },
      },
    },
    {
      $project: {
        predictedIncomeNextShift: '$incomeMedian',
      },
    },
  ]).exec();

  const prediction = result[0] && result[0].predictedIncomeNextShift;

  return { prediction, nextShift: { start: nextShift.start, timezone: nextShift.timezone } };
};
