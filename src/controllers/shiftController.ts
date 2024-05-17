import { Request, Response, NextFunction } from 'express';
import { IShift } from '../interfaces/Shift.interface';
import Shift from '../models/Shift';
import HttpErrorResponse from '../classes/HttpErrorResponse';
import Gig from '../models/Gig';
import { IGig } from 'src/interfaces/Gig.interface';
import { HydratedDocument } from 'mongoose';

export const getAllShiftsByGig = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { gigId } = req.params;

    const shifts: HydratedDocument<IShift>[] = await Shift.find({ gigId: gigId }).sort({ startDate: 1 });

    res.status(200).json(shifts);
  } catch (error) {
    console.error('Shift Controller - GetShiftsByGig Error: ', error);
    next(error);
  }
};

export const getShiftById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { shiftId } = req.params;

    const shift: HydratedDocument<IShift> | null = await Shift.findById(shiftId);

    if (!shift) throw new HttpErrorResponse(404, 'Requested resource not found');

    res.status(200).json(shift);
  } catch (error) {
    console.error('Shift Controller - GetShiftById Error: ', error);
    next(error);
  }
};

export const addShift = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { gigId, startDate, startTime, endDate, endTime, notes } = req.body;

    const gig: HydratedDocument<IGig> | null = await Gig.findById(gigId);

    if (!gig) throw new HttpErrorResponse(404, 'Requested Resource not found');

    const shift = new Shift({
      gigId,
      startDate,
      startTime,
      endDate,
      endTime,
      notes,
    });

    const savedShift: HydratedDocument<IShift> = await shift.save();

    if (!gig.shifts) {
      gig.shifts = [];
    }
    gig.shifts.push(savedShift._id);
    gig.save();

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
    const { shiftId, gigId, startDate, startTime, endDate, endTime, notes } = req.body;

    const shift: HydratedDocument<IShift> | null = await Shift.findById(shiftId);

    if (!shift) throw new HttpErrorResponse(404, 'Requested Resource not found');

    shift.gigId = gigId;
    shift.startDate = startDate;
    shift.startTime = startTime;
    shift.endDate = endDate;
    shift.endTime = endTime;
    shift.notes = notes;

    await shift.save();

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
    const { shiftId, gigId } = req.body;

    const gig: HydratedDocument<IGig> | null = await Gig.findById(gigId);

    if (!gig) throw new HttpErrorResponse(404, 'Requested resource not found');
    const filteredGigs = gig.shifts?.filter((id) => id.toString() !== shiftId);

    if (!filteredGigs || filteredGigs.length === 0) {
      gig.shifts = null;
    } else {
      gig.shifts = filteredGigs;
    }

    await gig.save();

    await Shift.deleteOne({ _id: shiftId });
    res.status(200).json({ message: 'Shift deleted' });
  } catch (error) {
    console.error('Shift Controller - DeleteShift Error: ', error);
    next(error);
  }
};

export default {
  getAllShiftsByGig,
  getShiftById,
  addShift,
  updateShift,
  deleteShift,
};
