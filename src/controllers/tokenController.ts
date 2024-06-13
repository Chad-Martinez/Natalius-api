import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload, VerifyErrors } from 'jsonwebtoken';
import { HydratedDocument } from 'mongoose';
import HttpErrorResponse from '../classes/HttpErrorResponse';
import { IRefreshToken } from '../interfaces/RefreshToken.interface';
import { IUser } from '../interfaces/User.interface';
import User from '../models/User';

const handleRefreshToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const cookies = req.cookies;
    if (!cookies?.jwt) throw new HttpErrorResponse(418, 'Forbbiden - Missing token');
    const refreshToken: string = cookies.jwt;
    res.clearCookie('jwt', { httpOnly: true, sameSite: 'none', secure: true });
    const user: HydratedDocument<IUser> | null = await User.findOne({ refreshTokens: refreshToken });

    if (!user) {
      jwt.verify(
        refreshToken,
        process.env.JWT_SECRET!,
        async (error: VerifyErrors | null, decoded: string | JwtPayload | undefined | IRefreshToken): Promise<void> => {
          if (error) {
            const err = new HttpErrorResponse(418, 'Forbidden - Reuse');
            next(err);
            return;
          }

          const token = decoded as IRefreshToken;
          const hackedUser: HydratedDocument<IUser> | null = await User.findOne({
            email: token?.email,
          });

          if (hackedUser) {
            hackedUser.refreshTokens = [];
            await hackedUser.save();
          }
        },
      );
      throw new HttpErrorResponse(418, 'Forbidden - Reuse');
    }

    const newRefreshTokenArray: String[] = user.refreshTokens.filter((rt) => rt !== refreshToken);

    jwt.verify(
      refreshToken,
      process.env.JWT_SECRET!,
      async (error: VerifyErrors | null, decoded: string | JwtPayload | undefined | IRefreshToken): Promise<void> => {
        if (error) {
          user.refreshTokens = [...newRefreshTokenArray];
          await user.save();
        }
        const token = decoded as IRefreshToken;
        if (error || user.email !== token.email) {
          const err = new HttpErrorResponse(418, 'Forbidden - Exp');
          next(err);
          return;
        }

        const accessToken: string = jwt.sign(
          {
            userId: user._id,
          },
          process.env.JWT_SECRET!,
          { expiresIn: '10m' },
        );

        const newRefreshToken: string = jwt.sign({ email: user.email }, process.env.JWT_SECRET!, { expiresIn: '15d' });

        user.refreshTokens = [...newRefreshTokenArray, newRefreshToken];
        await user.save();

        res.cookie('jwt', newRefreshToken, {
          httpOnly: true,
          secure: true,
          sameSite: 'none',
          maxAge: 15 * 24 * 60 * 60 * 1000,
        });

        res.json({ accessToken });
      },
    );
  } catch (error) {
    console.error('TokenController Error - HandleRefreshToken: ', error);
    next(error);
  }
};

export default handleRefreshToken;
