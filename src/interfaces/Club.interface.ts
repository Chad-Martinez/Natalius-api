import { Types } from 'mongoose';
import { IShift } from './Shift.interface';

export interface IClub extends Document {
  name: String;
  address: {
    street: String | null;
    city: String | null;
    state: String | null;
    zip: Number | null;
  };
  contact: {
    name: String | null;
    phone: Number | null;
  };
  defaults: {
    useDefaults: boolean;
    floorFee?: Number;
    pricePerDance?: Number;
    tips?: Number;
    other?: Number;
    milage?: Number;
    timezone: String;
  };
  shifts: (Types.ObjectId | IShift)[] | null;
  milage: Number;
  userId: Types.ObjectId;
  isArchived: boolean;
}
