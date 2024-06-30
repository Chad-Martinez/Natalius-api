import { Types } from 'mongoose';

export interface IShiftBase {
  start: Date;
  end: Date;
  notes?: String;
  incomeReported?: boolean;
  clubId: Types.ObjectId;
  userId: Types.ObjectId;
}

export interface IShift extends IShiftBase {
  _id: Types.ObjectId;
}
