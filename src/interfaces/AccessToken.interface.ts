import { JwtPayload } from 'jsonwebtoken';

export interface IAccessToken extends JwtPayload {
  userId: string;
}
