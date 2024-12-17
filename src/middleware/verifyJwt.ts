import { NextFunction, Response } from 'express';
import jwt, { JwtPayload, TokenExpiredError } from 'jsonwebtoken';
import HttpErrorResponse from '../classes/HttpErrorResponse';
import { IAccessToken } from '../interfaces/AccessToken.interface';
import { ICustomRequest } from '../interfaces/CustomeRequest.interface';

const verifyJWT = (req: ICustomRequest, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization || (req.headers.Authorization as string);
    if (!authHeader?.startsWith('Bearer ')) {
      res.status(403).json({ message: 'Unauthorized - Missing Token' });
      return;
    }

    const token: string = authHeader.split(' ')[1];
    const decodedToken: JwtPayload | string = jwt.verify(token, process.env.JWT_SECRET!) as IAccessToken;

    req.userId = decodedToken.userId;
    next();
  } catch (error) {
    console.error('VerifyJwt Middleware Error: ', error);
    if (error instanceof TokenExpiredError) {
      return next(new HttpErrorResponse(403, 'Unauthorized - Expired Token'));
    }
    return next(error);
  }
};

export default verifyJWT;
