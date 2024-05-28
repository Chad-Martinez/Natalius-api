import { Request, Response, NextFunction } from 'express';
import HttpErrorResponse from '../classes/HttpErrorResponse';
import { IGig } from '../interfaces/Gig.interface';
import Gig from '../models/Gig';
import Shift from '../models/Shift';
import { HydratedDocument, isValidObjectId } from 'mongoose';
import { ICustomRequest } from 'src/interfaces/CustomeRequest.interface';

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const getGigsByUser = async (req: ICustomRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userId } = req;

    if (!isValidObjectId(userId)) throw new HttpErrorResponse(400, 'Provided id is not valid');

    const gigs = await Gig.aggregate([
      {
        $lookup: {
          from: 'shifts',
          localField: 'shifts',
          foreignField: '_id',
          as: 'shiftDetails',
        },
      },
      {
        $addFields: {
          shifts: {
            $map: {
              input: '$shiftDetails',
              as: 'shift',
              in: {
                _id: '$$shift._id',
                startDate: {
                  $concat: [
                    {
                      $arrayElemAt: [DAYS_OF_WEEK, { $subtract: [{ $dayOfWeek: '$$shift.startDate' }, 1] }],
                    },
                    ' ',
                    { $substr: [{ $dateToString: { format: '%b', date: '$$shift.startDate' } }, 0, 3] },
                    ' ',
                    { $substr: [{ $dateToString: { format: '%d', date: '$$shift.startDate' } }, 0, 2] },
                    " '",
                    { $substr: [{ $dateToString: { format: '%Y', date: '$$shift.startDate' } }, 2, 2] },
                  ],
                },
                endDate: {
                  $concat: [
                    {
                      $arrayElemAt: [DAYS_OF_WEEK, { $subtract: [{ $dayOfWeek: '$$shift.endDate' }, 1] }],
                    },
                    ' ',
                    { $substr: [{ $dateToString: { format: '%b', date: '$$shift.endDate' } }, 0, 3] },
                    ' ',
                    { $substr: [{ $dateToString: { format: '%d', date: '$$shift.endDate' } }, 0, 2] },
                    " '",
                    { $substr: [{ $dateToString: { format: '%Y', date: '$$shift.endDate' } }, 2, 2] },
                  ],
                },
                startTime: {
                  $concat: [
                    {
                      $dateToString: {
                        format: '%H:%M',
                        date: '$$shift.startTime',
                      },
                    },
                    {
                      $cond: [{ $gte: [{ $hour: { date: '$$shift.startTime' } }, 12] }, 'pm', 'am'],
                    },
                  ],
                },
                endTime: {
                  $concat: [
                    {
                      $dateToString: {
                        format: '%H:%M',
                        date: '$$shift.endTime',
                      },
                    },
                    {
                      $cond: [{ $gte: [{ $hour: { date: '$$shift.endTime' } }, 12] }, 'pm', 'am'],
                    },
                  ],
                },
                notes: '$$shift.notes',
                created_at: '$$shift.created_at',
                updated_at: '$$shift.updated_at',
              },
            },
          },
          fullAddress: {
            $trim: {
              input: {
                $reduce: {
                  input: [
                    {
                      $cond: {
                        if: { $ifNull: ['$address.street', false] },
                        then: '$address.street',
                        else: '',
                      },
                    },
                    {
                      $cond: {
                        if: { $ifNull: ['$address.city', false] },
                        then: {
                          $concat: [
                            '$address.city',
                            {
                              $cond: {
                                if: { $and: [{ $ifNull: ['$address.city', false] }, { $ifNull: ['$address.state', false] }] },
                                then: ',',
                                else: '',
                              },
                            },
                          ],
                        },
                        else: '',
                      },
                    },
                    {
                      $cond: {
                        if: { $ifNull: ['$address.state', false] },
                        then: '$address.state',
                        else: '',
                      },
                    },
                    {
                      $cond: {
                        if: { $ifNull: ['$address.zip', false] },
                        then: { $toString: '$address.zip' },
                        else: '',
                      },
                    },
                  ],
                  initialValue: '',
                  in: {
                    $concat: [
                      '$$value',
                      {
                        $cond: {
                          if: { $eq: ['$$value', ''] },
                          then: '',
                          else: ' ',
                        },
                      },
                      '$$this',
                    ],
                  },
                },
              },
            },
          },
        },
      },
      {
        $project: {
          _id: 1,
          name: 1,
          address: 1,
          fullAddress: 1,
          contact: 1,
          shifts: 1,
          distance: 1,
          userId: 1,
          created_at: 1,
          updated_at: 1,
        },
      },
    ]).exec();

    res.status(200).json(gigs);
  } catch (error) {
    console.error('Gig Controller Error - GigsByUser: ', error);
    next(error);
  }
};

export const getGigNames = async (req: ICustomRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userId } = req;

    if (!isValidObjectId(userId)) throw new HttpErrorResponse(400, 'Provided id is not valid');

    const gigs: HydratedDocument<IGig>[] = await Gig.find({ userId }, { name: 1 });

    res.status(200).json(gigs);
  } catch (error) {
    console.error('Gig Controller Error - GigNames: ', error);
    next(error);
  }
};

export const getGigById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { gigId } = req.params;

    if (!isValidObjectId(gigId)) throw new HttpErrorResponse(400, 'Provided id is not valid');

    const gig: HydratedDocument<IGig> | null = await Gig.findById(gigId).populate('shifts').exec();

    if (!gig) throw new HttpErrorResponse(404, 'Requested resource not found');

    res.status(200).json(gig);
  } catch (error) {
    console.error('Gig Controller Error - GigById: ', error);
    next(error);
  }
};

export const addGig = async (req: ICustomRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, address, contact, distance } = req.body;

    const { userId } = req;

    const gig = new Gig({
      name,
      address,
      contact,
      distance,
      userId,
    });

    await gig.save();

    res.status(201).json({ _id: gig._id });
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
    const { gigId, name, address, contact, distance } = req.body;

    if (!isValidObjectId(gigId)) throw new HttpErrorResponse(400, 'Provided id is not valid');

    const gig: HydratedDocument<IGig> | null = await Gig.findById(gigId);

    if (!gig) throw new HttpErrorResponse(404, 'Requested resource not found');

    gig.name = name;
    gig.address = address;
    gig.contact = contact;
    gig.distance = distance;

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

// WILL NEED TO IMPLEMENT LOGIC DUE TO GIG - SHIFT - INCOME RELATIONSHIPS
export const deleteGig = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { gigId } = req.params;

    if (!isValidObjectId(gigId)) throw new HttpErrorResponse(400, 'Provided id is not valid');

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
  getGigsByUser,
  getGigNames,
  getGigById,
  addGig,
  updateGig,
  deleteGig,
};
