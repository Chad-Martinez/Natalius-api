import { Types } from 'mongoose';

export interface IShift {
  _id?: Types.ObjectId;
  start: Date;
  end: Date;
  notes: String;
  gigId: Types.ObjectId;
}
