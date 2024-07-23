import { JwtPayload } from 'jsonwebtoken';

export interface IEmailToken extends JwtPayload {
  email: string;
}
