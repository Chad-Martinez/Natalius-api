import { JwtPayload } from 'jsonwebtoken';

export interface IRefreshToken extends JwtPayload {
  email: string;
}
