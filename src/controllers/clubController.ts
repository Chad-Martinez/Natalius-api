import { Request, Response, NextFunction } from 'express';
import HttpErrorResponse from '../classes/HttpErrorResponse';
import { IClub } from '../interfaces/Club.interface';
import Club from '../models/Club';
import { HydratedDocument, Types, isValidObjectId } from 'mongoose';
import { ICustomRequest } from '../interfaces/CustomeRequest.interface';

export const getClubsByUser = async (req: ICustomRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userId } = req;

    if (!isValidObjectId(userId)) throw new HttpErrorResponse(400, 'Provided id is not valid');

    const clubs = await Club.aggregate([
      {
        $match: {
          userId: new Types.ObjectId(userId),
        },
      },
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
              input: {
                $sortArray: {
                  input: '$shiftDetails',
                  sortBy: { start: 1 },
                },
              },
              as: 'shift',
              in: {
                _id: '$$shift._id',
                clubId: '$$shift.clubId',
                start: '$$shift.start',
                end: '$$shift.end',
                notes: '$$shift.notes',
                shiftComplete: '$$shift.shiftComplete',
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
          isArchived: 1,
          userId: 1,
          created_at: 1,
          updated_at: 1,
        },
      },
    ]).exec();

    res.status(200).json(clubs);
  } catch (error) {
    console.error('Club Controller Error - ClubsByUser: ', error);
    next(error);
  }
};

export const getClubNames = async (req: ICustomRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userId } = req;

    if (!isValidObjectId(userId)) throw new HttpErrorResponse(400, 'Provided id is not valid');

    const clubs: HydratedDocument<IClub>[] = await Club.find({ userId }, { name: 1 });

    res.status(200).json(clubs);
  } catch (error) {
    console.error('Club Controller Error - ClubNames: ', error);
    next(error);
  }
};

export const getClubById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { clubId } = req.params;

    if (!isValidObjectId(clubId)) throw new HttpErrorResponse(400, 'Provided id is not valid');

    const club: HydratedDocument<IClub> | null = await Club.findById(clubId).populate('shifts').exec();

    if (!club) throw new HttpErrorResponse(404, 'Requested resource not found');

    res.status(200).json(club);
  } catch (error) {
    console.error('Club Controller Error - ClubById: ', error);
    next(error);
  }
};

export const addClub = async (req: ICustomRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, address, contact, distance } = req.body;

    const { userId } = req;

    const club = new Club({
      name,
      address,
      contact,
      distance,
      userId,
    });

    await club.save();

    res.status(201).json({ _id: club._id });
  } catch (error) {
    console.error('Club Controller Error - AddClub: ', error);
    if (error.name === 'ValidationError') {
      const err = new HttpErrorResponse(422, error.message);
      next(err);
    } else {
      next(error);
    }
  }
};

export const updateClub = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { _id } = req.body;

    if (!isValidObjectId(_id)) throw new HttpErrorResponse(400, 'Provided id is not valid');

    const club: HydratedDocument<IClub> | null = await Club.findById(_id);

    if (!club) throw new HttpErrorResponse(404, 'Requested resource not found');

    delete req.body._id;

    const updates = Object.keys(req.body);

    updates.forEach((update: string) => {
      // @ts-ignore
      club[update] = req.body[update];
    });

    await club.save();

    res.status(200).json({ message: 'Club Information Updated' });
  } catch (error) {
    console.error('Club Controller Error - UpdateClub: ', error);
    if (error.name === 'ValidationError') {
      const err = new HttpErrorResponse(422, error.message);
      next(err);
    } else {
      next(error);
    }
  }
};

export default {
  getClubsByUser,
  getClubNames,
  getClubById,
  addClub,
  updateClub,
};
