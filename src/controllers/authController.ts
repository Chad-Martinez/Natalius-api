import { Request, Response, NextFunction } from 'express';
import HttpErrorResponse from '../classes/HttpErrorResponse';
import User from '../models/User';
import bcrypt from 'bcryptjs';

export const register = async (req: Request, res: Response, next: NextFunction) => {
  const { firstName, lastName, email, password } = req.body;
  try {
    const isExistingUser = await User.findOne({ email: email });

    if (isExistingUser) throw new HttpErrorResponse(409, 'Email already exists');

    const hashedPw = await new Promise((resolve, reject) => bcrypt.hash(password, 10, (err, hash) => (err ? reject(err) : resolve(hash))));

    const user = new User({
      firstName,
      lastName,
      email,
      hashedPw,
    });

    const createdUser = await user.save();

    res.status(201).json({ id: createdUser._id, message: 'Account created' });
  } catch (error) {
    console.error('Auth Controller Error - Register: ', error);
    if (error instanceof HttpErrorResponse) {
      next(error);
    } else if (error.name === 'ValidationError') {
      const err = new HttpErrorResponse(422, error.message);
      next(err);
    } else {
      next(error);
    }
  }
};

export default {
  register,
};
