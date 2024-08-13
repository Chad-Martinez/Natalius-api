import { Request, Response, NextFunction } from 'express';
import HttpErrorResponse from '../classes/HttpErrorResponse';
import Vendor from '../models/Vendor';
import { HydratedDocument, isValidObjectId } from 'mongoose';
import { IVendor } from '../interfaces/Vendor.interface';
import { ICustomRequest } from '../interfaces/CustomeRequest.interface';

export const getVendorsByUser = async (req: ICustomRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userId } = req;

    if (!isValidObjectId(userId)) throw new HttpErrorResponse(400, 'Provided id is not valid');

    const vendors: HydratedDocument<IVendor>[] = await Vendor.find({ userId: userId }, { _v: 0 }).sort({ name: 1 });

    res.status(200).json(vendors);
  } catch (error) {
    console.error('Vendor Controller Error - GetVendorsByUser: ', error);
    next(error);
  }
};

export const getVendorById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { vendorId } = req.params;

    if (!isValidObjectId(vendorId)) throw new HttpErrorResponse(400, 'Provided id is not valid');

    const vendor: HydratedDocument<IVendor> | null = await Vendor.findById(vendorId);

    if (!vendor) throw new HttpErrorResponse(404, 'Requested resource not found');

    res.status(200).json(vendor);
  } catch (error) {
    console.error('Vendor Controller Error - GetVendorById: ', error);
    next(error);
  }
};

export const addVendor = async (req: ICustomRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, defaultType, distance, notes } = req.body;

    const { userId } = req;

    const vendor = new Vendor({
      name,
      userId,
      defaultType,
      distance,
      notes,
    });
    await vendor.save();

    res.status(201).json({ _id: vendor._id });
  } catch (error) {
    console.error('Vendor Controller Error - AddVendor: ', error);
    if (error.name === 'ValidationError') {
      const err = new HttpErrorResponse(422, error.message);
      next(err);
    } else {
      next(error);
    }
  }
};

export const updateVendor = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { _id } = req.body;

    if (!isValidObjectId(_id)) throw new HttpErrorResponse(400, 'Provided id is not valid');

    const vendor: HydratedDocument<IVendor> | null = await Vendor.findById(_id);

    if (!vendor) throw new HttpErrorResponse(404, 'Requested resource not found');

    delete req.body._id;

    const updates = Object.keys(req.body);

    updates.forEach((update: string) => {
      // @ts-ignore
      vendor[update] = req.body[update];
    });

    await vendor.save();

    res.status(200).json({ message: 'Vendor update successful' });
  } catch (error) {
    console.error('Vendor Controller Error - UpdateVendor: ', error);
    if (error.name === 'ValidationError') {
      const err = new HttpErrorResponse(422, error.message);
      next(err);
    } else {
      next(error);
    }
  }
};

export default {
  getVendorsByUser,
  getVendorById,
  addVendor,
  updateVendor,
};
