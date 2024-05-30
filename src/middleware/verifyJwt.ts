import { NextFunction, Response } from 'express';
import jwt, { JwtPayload, TokenExpiredError } from 'jsonwebtoken';
import HttpErrorResponse from '../classes/HttpErrorResponse';
import { IAccessToken } from '../interfaces/AccessToken.interface';
import { ICustomRequest } from 'src/interfaces/CustomeRequest.interface';

const verifyJWT = (req: ICustomRequest, res: Response, next: NextFunction): Response | void => {
  try {
    const authHeader = req.headers.authorization || (req.headers.Authorization as string);
    if (!authHeader?.startsWith('Bearer ')) throw new HttpErrorResponse(401, 'Unauthorized - Missing Token');

    const token: string = authHeader.split(' ')[1];
    const decodedToken: JwtPayload | string = jwt.verify(token, process.env.JWT_SECRET!) as IAccessToken;

    req.userId = decodedToken.userId;
  } catch (error) {
    console.error('VerifyJwt Middleware Error: ', error);
    if (error instanceof TokenExpiredError) {
      const err = new HttpErrorResponse(403, 'Unauthorized - Expired Token');
      next(err);
    }
    next(error);
  }
  next();
};

export default verifyJWT;
