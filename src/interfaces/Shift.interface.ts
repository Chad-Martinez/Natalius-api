import { Types } from 'mongoose';

export interface IShift {
  start: Date;
  end: Date;
  notes: String;
  gigId: Types.ObjectId;
}
