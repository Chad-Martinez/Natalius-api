import { JwtPayload } from 'jsonwebtoken';

export interface IVerifyEmailToken extends JwtPayload {
  email: string;
}
