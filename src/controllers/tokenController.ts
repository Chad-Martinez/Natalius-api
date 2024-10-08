import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload, VerifyErrors } from 'jsonwebtoken';
import HttpErrorResponse from '../classes/HttpErrorResponse';
import { IRefreshToken } from '../interfaces/RefreshToken.interface';
import User from '../models/User';

const handleRefreshToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const cookies = req.cookies;
    if (!cookies?.jwt) throw new HttpErrorResponse(418, 'Forbidden - Missing token');
    const refreshToken: string = cookies.jwt;
    res.clearCookie('jwt', { httpOnly: true, sameSite: 'none', secure: true });

    const verifyToken = (token: string): Promise<IRefreshToken> => {
      return new Promise((resolve, reject) => {
        jwt.verify(token, process.env.JWT_SECRET!, (error: VerifyErrors | null, decoded: string | JwtPayload | undefined) => {
          if (error) reject(error);
          resolve(decoded as IRefreshToken);
        });
      });
    };

    try {
      const decodedToken = await verifyToken(refreshToken);

      const user = await User.findOneAndUpdate(
        { email: decodedToken.email, refreshTokens: refreshToken },
        { $pull: { refreshTokens: refreshToken } },
        { new: true },
      );

      if (!user) {
        // Token reuse detected
        await User.findOneAndUpdate({ email: decodedToken.email }, { $set: { refreshTokens: [] } });
        throw new HttpErrorResponse(418, 'Forbidden - Reuse');
      }

      const accessToken: string = jwt.sign({ userId: user._id }, process.env.JWT_SECRET!, { expiresIn: '10m' });

      const newRefreshToken: string = jwt.sign({ email: user.email }, process.env.JWT_SECRET!, { expiresIn: '15d' });

      await User.findOneAndUpdate({ _id: user._id }, { $push: { refreshTokens: newRefreshToken } });

      res.cookie('jwt', newRefreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        maxAge: 15 * 24 * 60 * 60 * 1000,
      });

      res.json({ accessToken });
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new HttpErrorResponse(418, 'Forbidden - Invalid token');
      }
      throw error;
    }
  } catch (error) {
    console.error('TokenController Error - HandleRefreshToken: ', error);
    next(error);
  }
};

export default handleRefreshToken;
