import { Request, Response, NextFunction } from 'express';
import { IShift } from '../interfaces/Shift.interface';
import Shift from '../models/Shift';
import HttpErrorResponse from '../classes/HttpErrorResponse';
import Gig from '../models/Gig';
import { IGig } from 'src/interfaces/Gig.interface';
import { HydratedDocument, isValidObjectId } from 'mongoose';

export const getAllShiftsByGig = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { gigId } = req.params;

    if (!isValidObjectId(gigId)) throw new HttpErrorResponse(400, 'Provided id is not valid');

    const shifts: HydratedDocument<IShift>[] = await Shift.find({ gigId: gigId }).sort({ start: 1 });

    res.status(200).json(shifts);
  } catch (error) {
    console.error('Shift Controller - GetShiftsByGig Error: ', error);
    next(error);
  }
};

export const getShiftById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { shiftId } = req.params;

    if (!isValidObjectId(shiftId)) throw new HttpErrorResponse(400, 'Provided id is not valid');

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
    const { gigId, start, end, notes } = req.body;

    const gig: HydratedDocument<IGig> | null = await Gig.findById(gigId);

    if (!gig) throw new HttpErrorResponse(404, 'Requested Resource not found');

    const shift = new Shift({
      gigId,
      start,
      end,
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
    const { shiftId, gigId, start, end, notes } = req.body;

    if (!isValidObjectId(shiftId)) throw new HttpErrorResponse(400, 'Provided id is not valid');

    const shift: HydratedDocument<IShift> | null = await Shift.findById(shiftId);

    if (!shift) throw new HttpErrorResponse(404, 'Requested Resource not found');

    shift.gigId = gigId;
    shift.start = start;
    shift.end = end;
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

    if (!isValidObjectId(gigId)) throw new HttpErrorResponse(400, 'Provided Gig id is not valid');

    if (!isValidObjectId(shiftId)) throw new HttpErrorResponse(400, 'Provided Shift id is not valid');

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
