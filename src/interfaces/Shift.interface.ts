import { Types } from 'mongoose';

export interface IShift {
  startDate: Date;
  startTime: Date;
  endDate: Date;
  endTime: Date;
  notes: String;
  gigId: Types.ObjectId;
}
