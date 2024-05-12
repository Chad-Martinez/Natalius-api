import { Request, Response, NextFunction } from 'express';
import { Transporter, createTransport } from 'nodemailer';
import jwt from 'jsonwebtoken';
import HttpErrorResponse from '../classes/HttpErrorResponse';
import hbs, { NodemailerExpressHandlebarsOptions } from 'nodemailer-express-handlebars';
import User from '../models/User';
import bcrypt from 'bcryptjs';

export const register = async (req: Request, res: Response, next: NextFunction) => {
  const { firstName, lastName, email, password } = req.body;
  try {
    const isExistingUser = await User.findOne({ email: email });

    if (isExistingUser) throw new HttpErrorResponse(409, 'Email already exists. If you forgot your password, try resetting it');

    const hashedPw = await new Promise((resolve, reject) => bcrypt.hash(password, 10, (err, hash) => (err ? reject(err) : resolve(hash))));

    const user = new User({
      firstName,
      lastName,
      email,
      hashedPw,
    });

    const createdUser = await user.save();

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

    res.status(201).json({ id: createdUser._id, message: 'Account created. Please verify your email address' });
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

export const login = async (req: Request, res: Response, next: NextFunction) => {
  const { email, password } = req.body;

  try {
    if (!email || !password) throw new HttpErrorResponse(409, 'Email and password required');
    const user = await User.findOne({ email: email });
    if (!user) throw new HttpErrorResponse(404, 'Email or password is incorrect');

    const isMatch = await bcrypt.compare(password, user.hashedPw);
    if (!isMatch) throw new HttpErrorResponse(401, 'Email or password is incorrect');

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

export default {
  register,
  login,
};
