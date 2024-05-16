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

export const register: RequestHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { firstName, lastName, email, password } = req.body;
  try {
    const isExistingUser: IUser | null = await User.findOne({ email: email });

    if (isExistingUser) throw new HttpErrorResponse(409, 'Email already exists. If you forgot your password, try resetting it');

    const hashedPw: string = await new Promise((resolve, reject) => bcrypt.hash(password, 10, (err, hash) => (err ? reject(err) : resolve(hash))));

    const user = new User<IUser>({
      firstName,
      lastName,
      email,
      hashedPw,
    });

    const createdUser = await user.save();

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

    await transporter.sendMail(mail);

    res.status(201).json({ id: createdUser._id, message: 'Account created. Please verify your email address to activate your account' });
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
    const { email, password } = req.body;
    if (!email || !password) throw new HttpErrorResponse(409, 'Email and password required');

    const user: IUser | null = await User.findOne({ email: email });
    if (!user) throw new HttpErrorResponse(404, 'Email or password is incorrect');

    const isMatch: boolean = await bcrypt.compare(password, user.hashedPw);
    if (!isMatch) throw new HttpErrorResponse(401, 'Email or password is incorrect');

    if (!user.isEmailVerified) throw new HttpErrorResponse(401, 'Please verify your email address to activate your account.');

    res.status(200).json({ id: user._id });
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

const verifyEmail: RequestHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { token } = req.params;
    const decodedToken: string | JwtPayload = jwt.verify(token, process.env.JWT_SECRET!);
    const { email } = decodedToken as IVerifyEmailToken;
    const user: IUser | null = await User.findOne({ email: email });

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
  verifyEmail,
};
