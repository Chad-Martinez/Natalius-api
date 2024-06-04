import { Types } from 'mongoose';

export interface IShift {
  _id?: Types.ObjectId;
  start: Date;
  end: Date;
  notes?: String;
  incomeReported?: boolean;
  gigId: Types.ObjectId;
}
