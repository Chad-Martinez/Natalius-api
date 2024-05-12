import { Request, Response, NextFunction } from 'express';
import path from 'path';
import { readFileSync } from 'fs';
import { Transporter, createTransport } from 'nodemailer';
import jwt, { JsonWebTokenError, JwtPayload } from 'jsonwebtoken';
import HttpErrorResponse from '../classes/HttpErrorResponse';
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

    // const __dirname: string = path.resolve();
    // const filePath: string = path.join(__dirname, './src/templates/verify-email.handlebars');
    // const emailSource: string = readFileSync(filePath, 'utf-8').toString();

    // const token: string = jwt.sign(
    //   {
    //     email: email,
    //   },
    //   process.env.JWT_SECRET!,
    // );

    // const template: HandlebarsTemplateDelegate<any> = Handlebars.compile(emailSource);

    // const replacements: { name: string; link: string; website: string } = {
    //   name: firstName,
    //   link: `${process.env.REGISTER_LINK}${token}`,
    //   website: process.env.WEBSITE!,
    // };

    // const htmlToSend = template(replacements);

    const result = await transporter.sendMail({
      to: email,
      from: process.env.SENDER_EMAIL,
      subject: 'Please verify your email address',
      text: 'Test email',
      //   html: htmlToSend,
    });

    console.log('EMAIL RESULT ', result);

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
