import { Request, Response, NextFunction } from 'express';
import HttpErrorResponse from '../classes/HttpErrorResponse';
import Vendor from '../models/Vendor';
import { HydratedDocument, isValidObjectId } from 'mongoose';
import { IVendor } from 'src/interfaces/Vendor.interface';

export const getVendorsByUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userId } = req.params;

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

export const addVendor = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, userId, defaultType } = req.body;

    const vendor = new Vendor({
      name,
      userId,
      defaultType,
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
    const { vendorId, name, userId, defaultType } = req.body;

    if (!isValidObjectId(vendorId)) throw new HttpErrorResponse(400, 'Provided id is not valid');

    const vendor: HydratedDocument<IVendor> | null = await Vendor.findById(vendorId);

    if (!vendor) throw new HttpErrorResponse(404, 'Requested resource not found');

    vendor.name = name;
    vendor.userId = userId;
    vendor.defaultType = defaultType || 'NONE';

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

// NEED TO WRITE EXPENSE API BEFORE DELETING VENDOR

// export const deleteVendor = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
//   try {
//     const { vendorId } = req.params;

//     if (!isValidObjectId(vendorId)) throw new HttpErrorResponse(400, 'Provided id is not valid');

//   } catch (error) {
//     console.error('Vendor Controller Error - AddVendor: ', error);
//   }
// };

export default {
  getVendorsByUser,
  getVendorById,
  addVendor,
  updateVendor,
};
