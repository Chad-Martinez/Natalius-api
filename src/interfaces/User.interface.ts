import { Document } from 'mongodb';

export interface IUser extends Document {
  email: string;
  hashedPw: string;
  firstName: string;
  lastName: string;
  isEmailVerified?: boolean;
  created_at?: Date;
  updated_at?: Date;
}
