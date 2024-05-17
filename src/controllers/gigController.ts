import { Request, Response, NextFunction } from 'express';
import HttpErrorResponse from '../classes/HttpErrorResponse';
import { IGig } from '../interfaces/Gig.interface';
import Gig from '../models/Gig';
import Shift from '../models/Shift';
import { HydratedDocument } from 'mongoose';

export const getAllGigsByUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userId } = req.params;

    const gigs: HydratedDocument<IGig>[] = await Gig.find({ userId: userId }).populate('shifts').exec();

    res.status(200).json(gigs);
  } catch (error) {
    console.error('Gig Controller Error - GigByUser: ', error);
    next(error);
  }
};

export const getGigById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { gigId } = req.params;

    const gig: HydratedDocument<IGig> | null = await Gig.findById(gigId).populate('shifts').exec();

    if (!gig) throw new HttpErrorResponse(404, 'Requested resource not found');

    res.status(200).json(gig);
  } catch (error) {
    console.error('Gig Controller Error - GigById: ', error);
    next(error);
  }
};

export const addGig = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, address, contact, distance, userId } = req.body;

    const gig = new Gig({
      name,
      address,
      contact,
      distance,
      userId,
    });

    await gig.save();

    res.status(201).json({ gigId: gig._id });
  } catch (error) {
    console.error('Gig Controller Error - AddGig: ', error);
    if (error.name === 'ValidationError') {
      const err = new HttpErrorResponse(422, error.message);
      next(err);
    } else {
      next(error);
    }
  }
};

export const updateGig = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { gigId, name, address, contact, distance, userId } = req.body;

    const gig: HydratedDocument<IGig> | null = await Gig.findById(gigId);

    if (!gig) throw new HttpErrorResponse(404, 'Requested resource not found');

    gig.name = name;
    gig.address = address;
    gig.contact = contact;
    gig.distance = distance;
    gig.userId = userId;

    await gig.save();

    res.status(200).json({ message: 'Gig Information Updated' });
  } catch (error) {
    console.error('Gig Controller Error - UpdateGig: ', error);
    if (error.name === 'ValidationError') {
      const err = new HttpErrorResponse(422, error.message);
      next(err);
    } else {
      next(error);
    }
  }
};

export const deleteGig = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { gigId } = req.params;

    const gig: HydratedDocument<IGig> | null = await Gig.findById(gigId);

    await Shift.deleteMany({ gigId: gig?.shifts });

    await Gig.deleteOne({ _id: gigId });

    res.status(200).json({ message: 'Gig and all associated shift information has been deleted.' });
  } catch (error) {
    console.error('Gig Controller Error - DeleteGig: ', error);
    if (error instanceof HttpErrorResponse) {
      next(error);
    } else {
      next(error);
    }
  }
};

export default {
  getAllGigsByUser,
  getGigById,
  addGig,
  updateGig,
  deleteGig,
};
