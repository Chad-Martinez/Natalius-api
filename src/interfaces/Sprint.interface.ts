import { Types } from 'mongoose';

export interface ISprintBase {
  start: Date;
  end: Date;
  goal: Number;
  incomes: Types.ObjectId[];
  isCompleted: Boolean;
  goalMet: Boolean;
  total: Number;
  userId: Types.ObjectId;
}

export interface ISprint extends ISprintBase {
  _id: Types.ObjectId;
}
