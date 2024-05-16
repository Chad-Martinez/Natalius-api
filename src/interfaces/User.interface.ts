import { Document, ObjectId } from 'mongodb';

export interface IUser extends Document {
  _id?: ObjectId;
  email: string;
  hashedPw: string;
  firstName: string;
  lastName: string;
  isEmailVerified?: boolean;
  created_at?: Date;
  updated_at?: Date;
}
