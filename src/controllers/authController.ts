import { Request, Response, NextFunction, RequestHandler } from 'express';
import { Transporter, createTransport } from 'nodemailer';
import jwt, { JwtPayload } from 'jsonwebtoken';
import HttpErrorResponse from '../classes/HttpErrorResponse';
import hbs, { NodemailerExpressHandlebarsOptions } from 'nodemailer-express-handlebars';
import { IVerifyEmailToken } from 'src/interfaces/VerifyEmailToken.interface';
import { IUser } from 'src/interfaces/User.interface';
import User from '../models/User';
import bcrypt from 'bcryptjs';
import Account from '../models/Account';
import { HydratedDocument } from 'mongoose';

export const register: RequestHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { firstName, lastName, email, password } = req.body;
  try {
    const isExistingUser: HydratedDocument<IUser> | null = await User.findOne({ email: email });

    if (isExistingUser) throw new HttpErrorResponse(409, 'Email already exists. If you forgot your password, try resetting it');

    const hashedPw: string = await new Promise((resolve, reject) => bcrypt.hash(password, 10, (err, hash) => (err ? reject(err) : resolve(hash))));

    const user = new User({
      firstName,
      lastName,
      email,
      hashedPw,
    });

    const createdUser: HydratedDocument<IUser> = await user.save();

    const account = new Account({
      userId: createdUser._id,
    });

    await account.save();

    const transporter: Transporter = createTransport({
      service: 'iCloud',
      auth: {
        user: process.env.ICLOUD_USER,
        pass: process.env.ICLOUD_PW,
      },
    });

    const token: string = jwt.sign(
      {
        email: email,
      },
      process.env.JWT_SECRET!,
    );

    const options: NodemailerExpressHandlebarsOptions = {
      viewEngine: {
        extname: '.hbs',
        layoutsDir: 'src/views/email/',
        defaultLayout: 'template',
        partialsDir: 'src/views/email/',
      },
      viewPath: 'src/views/email',
      extName: '.hbs',
    };

    transporter.use('compile', hbs(options));

    const mail = {
      from: process.env.SENDER_EMAIL,
      to: email,
      subject: 'Welcome to Natalius - Please verify your email address',
      template: 'template',
      context: {
        name: `${firstName} ${lastName}`,
        link: `${process.env.WEBSITE_URL}/verify/${token}`,
      },
    };

    res.status(201).json({ id: createdUser._id, message: 'Account created. Please verify your email address to activate your account' });

    await transporter.sendMail(mail);
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

export const login: RequestHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const cookies = req.cookies;

    const { email, password } = req.body;
    if (!email || !password) throw new HttpErrorResponse(409, 'Email and password required');

    const user: HydratedDocument<IUser> | null = await User.findOne({ email: email });
    if (!user) throw new HttpErrorResponse(404, 'Email or password is incorrect');

    if (!user.isEmailVerified) throw new HttpErrorResponse(401, 'Please verify your email address to activate your account.');

    const isMatch: boolean = await bcrypt.compare(password, user.hashedPw);
    if (!isMatch) throw new HttpErrorResponse(401, 'Email or password is incorrect');

    const accessToken = jwt.sign(
      {
        userId: user._id,
      },
      process.env.JWT_SECRET!,
      { expiresIn: '10m' },
    );

    const newRefreshToken = jwt.sign({ email: user.email }, process.env.JWT_SECRET!, { expiresIn: '15d' });

    let newRefreshTokenArray = !cookies?.jwt ? user.refreshTokens : user.refreshTokens.filter((rt) => rt !== cookies.jwt);

    if (cookies?.jwt) {
      const refreshToken = cookies.jwt;
      const foundToken = await User.findOne({ refreshToken });

      if (!foundToken) {
        newRefreshTokenArray = [];
      }

      res.clearCookie('jwt', { httpOnly: true, sameSite: 'none', secure: true });
    }

    user.refreshTokens = [...newRefreshTokenArray, newRefreshToken];
    await user.save();

    res.cookie('jwt', newRefreshToken, { httpOnly: true, sameSite: 'none', secure: true, maxAge: 24 * 60 * 60 * 1000 });

    res.status(200).json({ id: user._id, accessToken });
  } catch (error) {
    console.error('Auth Controller Error - Login: ', error);
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

export const logout: RequestHandler = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
  try {
    const cookies = req.cookies;
    if (!cookies?.jwt) return res.sendStatus(204);

    const refreshTokens = cookies.jwt;

    const user = await User.findOne({ refreshTokens });
    if (!user) {
      res.clearCookie('jwt', { httpOnly: true, sameSite: 'none', secure: true });
      return res.sendStatus(204);
    }

    user.refreshTokens = user.refreshTokens.filter((rt) => rt !== refreshTokens);
    const result = await user.save();

    res.clearCookie('jwt', { httpOnly: true, sameSite: 'none', secure: true });
    res.sendStatus(204);
  } catch (error) {
    console.error('Auth Controller Error - Logout: ', error);
    next(error);
  }
};

export const verifyEmail: RequestHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { token } = req.params;
    const decodedToken: string | JwtPayload = jwt.verify(token, process.env.JWT_SECRET!);
    const { email } = decodedToken as IVerifyEmailToken;
    const user: HydratedDocument<IUser> | null = await User.findOne({ email: email });

    if (!user) throw new HttpErrorResponse(404, 'A user with that email could not be found');

    user.isEmailVerified = true;
    await user.save();

    res.status(200).json({ message: 'Email verified' });
  } catch (error) {
    console.error('Auth Controller Error - Verify Email: ', error);
    next(error);
  }
};

export default {
  register,
  login,
  logout,
  verifyEmail,
};
