import { Response, NextFunction, RequestHandler } from 'express';
import HttpErrorResponse from '../classes/HttpErrorResponse';
import { IUser } from '../interfaces/User.interface';
import User from '../models/User';
import bcrypt from 'bcryptjs';
import { HydratedDocument } from 'mongoose';
import { ICustomRequest } from '../interfaces/CustomeRequest.interface';

export const getUserInfo: RequestHandler = async (req: ICustomRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userId } = req;
    const user: HydratedDocument<IUser> | null = await User.findById(userId, { firstName: 1, lastName: 1, email: 1 });

    if (!user) throw new HttpErrorResponse(404, 'Requested resource not found');

    res.status(200).json({ user });
  } catch (error) {
    console.error('Auth Controller Error - GetUserInfo: ', error);
    next(error);
  }
};

export const updateUserInfo: RequestHandler = async (req: ICustomRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userId } = req;

    const user: HydratedDocument<IUser> | null = await User.findById(userId);

    if (!user) throw new HttpErrorResponse(404, 'Requested resource not found');

    delete req.body._id;

    const updates = Object.keys(req.body);

    updates.forEach((update: string) => {
      // @ts-ignore
      user[update] = req.body[update];
    });

    await user.save();
    res.status(200).json({ message: 'Profile updated' });
  } catch (error) {
    console.error('Auth Controller Error - UpdateProfile: ', error.code);
    if (error.name === 'ValidationError') {
      const err = new HttpErrorResponse(422, error.message);
      next(err);
    } else if (error.code === 11000) {
      const err = new HttpErrorResponse(409, 'Email already exists.');
      next(err);
    } else {
      next(error);
    }
  }
};

export const updatePassword: RequestHandler = async (req: ICustomRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userId } = req;

    const user: HydratedDocument<IUser> | null = await User.findById(userId);

    if (!user) throw new HttpErrorResponse(404, 'Requested resource not found');

    const { pw } = req.body;
    const newHashedPw: string = await new Promise((resolve, reject) => bcrypt.hash(pw, 10, (err, hash) => (err ? reject(err) : resolve(hash))));

    user.hashedPw = newHashedPw;

    await user.save();

    res.status(200).json({ message: 'Password updated' });
  } catch (error) {
    console.error('Auth Controller Error - UpdatePassword: ', error);
    next(error);
  }
};

export default {
  getUserInfo,
  updateUserInfo,
  updatePassword,
};
