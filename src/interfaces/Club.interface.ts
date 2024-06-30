import { Types } from 'mongoose';
import { IShift } from './Shift.interface';

export interface IClub extends Document {
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
  shifts: (Types.ObjectId | IShift)[] | null;
  distance: Number;
  userId: Types.ObjectId;
  isArchived: boolean;
}
