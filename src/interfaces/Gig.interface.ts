import { Document, ObjectId } from 'mongodb';
import { IShift } from './Shift.interface';

export interface IGig extends Document {
  _id?: ObjectId;
  name: String;
  address?: {
    street: String;
    city: String;
    state: String;
    zip: Number;
  };
  contact?: {
    name: String;
    phone: Number;
  };
  shifts: (ObjectId | IShift)[] | null;
  distance: Number;
  userId: ObjectId;
  created_at?: Date;
  updated_at?: Date;
}
