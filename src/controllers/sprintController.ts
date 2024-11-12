import { Request, Response, NextFunction } from 'express';
import { HydratedDocument, Types, isValidObjectId } from 'mongoose';
import HttpErrorResponse from '../classes/HttpErrorResponse';
import { ICustomRequest } from '../interfaces/CustomeRequest.interface';
import Sprint from '../models/Sprint';
import { ISprint } from '../interfaces/Sprint.interface';
import dayjs from 'dayjs';
import { IShift } from '../interfaces/Shift.interface';
import Shift from '../models/Shift';

export const getActiveSprintByUser = async (req: ICustomRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userId } = req;

    if (!isValidObjectId(userId)) throw new HttpErrorResponse(400, 'Provided id is not valid');

    const sprint: HydratedDocument<ISprint> | null = await Sprint.findOne({ userId: userId, isCompleted: false });

    res.status(200).json(sprint);
  } catch (error) {
    console.error('Income Controller Error - IncomeByUser: ', error);
    next(error);
  }
};

export const getSprintWidgetData = async (userId: string): Promise<HydratedDocument<ISprint>> => {
  const sprint: HydratedDocument<ISprint>[] = await Sprint.aggregate([
    {
      $match: {
        userId: new Types.ObjectId(userId),
        isCompleted: false,
      },
    },
    {
      $lookup: {
        from: 'shifts',
        localField: 'shiftIds',
        foreignField: '_id',
        as: 'shiftDetails',
      },
    },
    {
      $addFields: {
        progress: { $sum: '$shiftDetails.income.amount' },
        timeLeft: {
          $divide: [{ $subtract: ['$end', new Date()] }, 1000 * 60 * 60 * 24],
        },
      },
    },
    {
      $project: {
        _id: 1,
        start: 1,
        end: 1,
        goal: 1,
        progress: 1,
        timeLeft: 1,
      },
    },
  ]).exec();
  return sprint[0];
};

export const addSprint = async (req: ICustomRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { start, goal } = req.body;

    const { userId } = req;

    const startDate = dayjs.utc(start).hour(0).minute(0).second(0).millisecond(0);
    const endDate = startDate.add(2, 'week');

    const shifts: HydratedDocument<IShift>[] = await Shift.find({ userId: userId, start: { $gte: startDate, $lte: endDate } });
    const mappedIds: Types.ObjectId[] = shifts.map((shift: IShift) => shift._id);

    const sprint = new Sprint({
      start: startDate,
      end: endDate,
      goal,
      shiftIds: mappedIds,
      isCompleted: false,
      userId,
    });
    await sprint.save();

    res.status(201).json({ sprintId: sprint._id, message: 'Sprint goal added' });
  } catch (error) {
    console.error('Sprint Controller Error - AddSprint: ', error);
    if (error.name === 'ValidationError') {
      const err = new HttpErrorResponse(422, error.message);
      next(err);
    } else {
      next(error);
    }
  }
};

export const updateSprint = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { _id, start, goal } = req.body;

    if (!isValidObjectId(_id)) throw new HttpErrorResponse(400, 'Provided id is not valid');

    const sprint: HydratedDocument<ISprint> | null = await Sprint.findById(_id);

    if (!sprint) throw new HttpErrorResponse(404, 'Requested resource not found');

    const startDate = dayjs.utc(start).hour(0).minute(0).second(0).millisecond(0);
    const endDate = startDate.add(2, 'week');

    sprint.start = startDate.toDate();
    sprint.end = endDate.toDate();
    sprint.goal = goal;

    const shifts: HydratedDocument<IShift>[] = await Shift.find({ userId: sprint.userId, start: { $gte: sprint.start, $lte: sprint.end } });
    const mappedIds: Types.ObjectId[] = shifts.map((shift: IShift) => shift._id);
    sprint.shiftIds = mappedIds;

    await sprint.save();

    res.status(200).json({ message: 'Sprint updated' });
  } catch (error) {
    console.error('Sprint Controller Error - UpdateSprint: ', error);
    if (error.name === 'ValidationError') {
      const err = new HttpErrorResponse(422, error.message);
      next(err);
    } else {
      next(error);
    }
  }
};

export const markSprintComplete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { _id, goal, progress } = req.body;

    if (!isValidObjectId(_id)) throw new HttpErrorResponse(400, 'Provided id is not valid');

    const sprint: HydratedDocument<ISprint> | null = await Sprint.findById(_id);

    if (!sprint) throw new HttpErrorResponse(404, 'Requested resource not found');

    sprint.isCompleted = true;
    sprint.goalMet = goal >= progress ? false : true;

    await sprint.save();

    res.status(200).json({ message: 'Sprint Completed', goalMet: sprint.goalMet });
  } catch (error) {
    console.error('Sprint Controller Error - UpdateSprint: ', error);
    if (error.name === 'ValidationError') {
      const err = new HttpErrorResponse(422, error.message);
      next(err);
    } else {
      next(error);
    }
  }
};

export const deleteSprint = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { sprintId } = req.params;

    if (!isValidObjectId(sprintId)) throw new HttpErrorResponse(400, 'Provided id is not valid');

    await Sprint.deleteOne({ _id: sprintId });

    res.status(200).json({ message: 'Sprint deleted' });
  } catch (error) {
    console.error('Sprint Controller Error - DeleteSprint: ', error);
    next(error);
  }
};
