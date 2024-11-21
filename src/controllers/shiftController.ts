import { Request, Response, NextFunction } from 'express';
import { ICustomRequest } from '../interfaces/CustomeRequest.interface';
import { HydratedDocument, Types, isValidObjectId } from 'mongoose';
import HttpErrorResponse from '../classes/HttpErrorResponse';
import Shift from '../models/Shift';
import { IShift } from '../interfaces/Shift.interface';
import Club from '../models/Club';
import { IClub } from '../interfaces/Club.interface';
import Sprint from '../models/Sprint';
import { ISprint } from '../interfaces/Sprint.interface';
import { getStartOfDay } from '../helpers/date-time-helpers';
import dayjs from 'dayjs';

export const getActiveShiftsByClub = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { clubId } = req.params;

    if (!isValidObjectId(clubId)) throw new HttpErrorResponse(400, 'Provided id is not valid');

    const shifts: HydratedDocument<IShift>[] = await Shift.find({ clubId: clubId, shiftComplete: false }).sort({ start: 1 });

    res.status(200).json(shifts);
  } catch (error) {
    console.error('Shift Controller - GetShiftsByClub Error: ', error);
    next(error);
  }
};

export const getShiftsToComplete = async (req: ICustomRequest, res: Response, next: NextFunction): Promise<HydratedDocument<IShift>[] | void> => {
  try {
    const { userId } = req;
    const shifts: HydratedDocument<IShift>[] = await Shift.aggregate([
      {
        $match: {
          userId: new Types.ObjectId(userId),
          end: { $lte: new Date(dayjs().add(1, 'hour').format()) },
          shiftComplete: false,
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
        $project: {
          _id: 1,
          clubId: 1,
          club: '$clubDetails.name',
          start: 1,
          end: 1,
          timezone: 1,
          notes: 1,
          shiftComplete: 1,
        },
      },
    ]).exec();

    res.status(200).json(shifts);
  } catch (error) {
    console.error('Get Next Three Shifts Error: ', error);
    next(error);
  }
};

export const getUpcomingShiftWidgetData = async (userId: string): Promise<HydratedDocument<IShift>[] | void> => {
  try {
    const shifts: HydratedDocument<IShift>[] = await Shift.aggregate([
      {
        $match: {
          userId: new Types.ObjectId(userId),
          start: { $gte: getStartOfDay() },
          end: { $gte: new Date(dayjs().add(1, 'hour').format()) },
          shiftComplete: false,
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
        $project: {
          _id: 1,
          clubId: 1,
          clubDetails: 1,
          start: 1,
          end: 1,
          timezone: 1,
          notes: 1,
          shiftComplete: 1,
        },
      },
    ]).exec();

    return shifts;
  } catch (error) {
    console.error('Get Next Three Shifts Error: ', error);
  }
};

export const getShiftById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { shiftId } = req.params;

    if (!isValidObjectId(shiftId)) throw new HttpErrorResponse(400, 'Provided id is not valid');

    const shift: HydratedDocument<IShift> | null = await Shift.findById(shiftId, { __v: 0, updated_at: 0, created_at: 0 });

    if (!shift) throw new HttpErrorResponse(404, 'Requested resource not found');

    res.status(200).json(shift);
  } catch (error) {
    console.error('Shift Controller - GetShiftById Error: ', error);
    next(error);
  }
};

export const addShift = async (req: ICustomRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { clubId, start, end, timezone, notes } = req.body;
    const { userId } = req;

    const club: HydratedDocument<IClub> | null = await Club.findById(clubId);

    if (!club) throw new HttpErrorResponse(404, 'Requested Resource not found');

    const shift = new Shift({
      clubId,
      start,
      end,
      timezone,
      notes,
      userId,
    });

    const savedShift: HydratedDocument<IShift> = await shift.save();

    if (!club.shifts) {
      club.shifts = [];
    }
    club.shifts.push(savedShift._id);
    club.save();

    const sprint: HydratedDocument<ISprint> | null = await Sprint.findOne({ userId: userId, isCompleted: false });

    if (sprint) {
      sprint as ISprint;
      if (dayjs(shift.start).isBetween(sprint.start, sprint.end)) {
        sprint.shiftIds.push(savedShift._id);
        await sprint.save();
      }
    }

    res.status(201).json({ shiftId: shift._id });
  } catch (error) {
    console.error('Shift Controller - AddShift Error: ', error);
    if (error.name === 'ValidationError') {
      const err = new HttpErrorResponse(422, error.message);
      next(err);
    } else {
      next(error);
    }
  }
};

export const updateShift = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { _id, clubId } = req.body;

    if (!isValidObjectId(_id)) throw new HttpErrorResponse(400, 'Provided id is not valid');

    const shift: HydratedDocument<IShift> | null = await Shift.findById(_id);

    if (!shift) throw new HttpErrorResponse(404, 'Requested Resource not found');

    delete req.body._id;

    const updates = Object.keys(req.body);

    updates.forEach((update: string) => {
      // @ts-ignore
      shift[update] = req.body[update];
    });

    await shift.save();

    const club: HydratedDocument<IClub> | null = await Club.findOne({ shifts: shift._id });

    if (!club) throw new HttpErrorResponse(404, 'Requested Resource not found');

    if (clubId !== club._id.toString()) {
      const shifts = club.shifts as Types.ObjectId[];
      club.shifts = shifts?.filter((s: Types.ObjectId) => s.toString() !== shift._id.toString());
      await club.save();

      const newClub: HydratedDocument<IClub> | null = await Club.findById(clubId);
      if (!newClub) throw new HttpErrorResponse(404, 'Requested Resource not found');
      newClub.shifts?.push(shift._id);
      await newClub.save();
    }

    const sprint: HydratedDocument<ISprint> | null = await Sprint.findOne({ isCompleted: false });

    if (sprint && dayjs(shift.start).isBetween(sprint.start, sprint.end) && !sprint.shiftIds.includes(shift._id)) sprint.shiftIds.push(shift._id);
    else if (sprint && !dayjs(shift.start).isBetween(sprint.start, sprint.end))
      sprint.shiftIds = sprint.shiftIds.filter((id) => id.toString() !== shift._id.toString());

    await sprint?.save();

    res.status(200).json({ message: 'Shift updated' });
  } catch (error) {
    console.error('Shift Controller - UpdateShift Error: ', error);
    if (error.name === 'ValidationError') {
      const err = new HttpErrorResponse(422, error.message);
      next(err);
    } else {
      next(error);
    }
  }
};

export const deleteShift = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { shiftId, clubId } = req.body;

    if (!isValidObjectId(clubId)) throw new HttpErrorResponse(400, 'Provided Club id is not valid');

    if (!isValidObjectId(shiftId)) throw new HttpErrorResponse(400, 'Provided Shift id is not valid');

    const club: HydratedDocument<IClub> | null = await Club.findById(clubId);

    if (club) {
      const filteredClubs = club.shifts?.filter((id) => id.toString() !== shiftId);

      if (!filteredClubs) {
        club.shifts = [];
      } else {
        club.shifts = filteredClubs;
      }
      await club.save();
    }

    const sprint = await Sprint.findOne({ shiftIds: shiftId });
    if (sprint) {
      sprint.shiftIds = sprint.shiftIds.filter((id) => id.toString() !== shiftId);
      await sprint.save();
    }

    await Shift.deleteOne({ _id: shiftId });
    res.status(200).json({ message: 'Shift deleted' });
  } catch (error) {
    console.error('Shift Controller - DeleteShift Error: ', error);
    next(error);
  }
};
