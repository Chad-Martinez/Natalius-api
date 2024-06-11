import { Request, Response, NextFunction } from 'express';
import { IShift } from '../interfaces/Shift.interface';
import Shift from '../models/Shift';
import HttpErrorResponse from '../classes/HttpErrorResponse';
import Gig from '../models/Gig';
import { IGig } from '../interfaces/Gig.interface';
import { HydratedDocument, Types, isValidObjectId } from 'mongoose';
import { ICustomRequest } from 'src/interfaces/CustomeRequest.interface';

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

export const addShift = async (req: ICustomRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { gigId, start, end, notes } = req.body;
    const { userId } = req;

    const gig: HydratedDocument<IGig> | null = await Gig.findById(gigId);

    if (!gig) throw new HttpErrorResponse(404, 'Requested Resource not found');

    const shift = new Shift({
      gigId,
      start,
      end,
      notes,
      userId,
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
    const { _id, gigId, start, end, notes, incomeReported } = req.body;

    if (!isValidObjectId(_id)) throw new HttpErrorResponse(400, 'Provided id is not valid');

    const shift: HydratedDocument<IShift> | null = await Shift.findById(_id);

    if (!shift) throw new HttpErrorResponse(404, 'Requested Resource not found');

    if (gigId) shift.gigId = gigId;
    if (start) shift.start = start;
    if (end) shift.end = end;
    if (incomeReported !== null || incomeReported !== undefined || incomeReported !== '') shift.incomeReported = incomeReported;
    if (notes) shift.notes = notes;

    await shift.save();

    const gig: HydratedDocument<IGig> | null = await Gig.findOne({ shifts: shift._id });

    if (!gig) throw new HttpErrorResponse(404, 'Requested Resource not found');

    if (gigId !== gig._id) {
      const shifts = gig.shifts as Types.ObjectId[];
      gig.shifts = shifts?.filter((s: Types.ObjectId) => s.toString() !== shift._id.toString());
      await gig.save();

      const newGig: HydratedDocument<IGig> | null = await Gig.findById(gigId);
      if (!newGig) throw new HttpErrorResponse(404, 'Requested Resource not found');
      newGig.shifts?.push(shift._id);
      await newGig.save();
    }

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

    if (!filteredGigs) {
      gig.shifts = [];
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
