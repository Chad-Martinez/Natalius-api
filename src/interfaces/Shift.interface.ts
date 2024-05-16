import { Document, ObjectId } from 'mongodb';

export interface IShift extends Document {
  _id?: ObjectId;
  startDate: Date;
  startTime: Date;
  endDate: Date;
  endTime: Date;
  notes: String;
  gigId: ObjectId;
  created_at?: Date;
  updated_at?: Date;
}
