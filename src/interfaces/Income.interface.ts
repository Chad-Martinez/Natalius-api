import { Types } from 'mongoose';
import { EnumType } from 'typescript';

export interface IIncome {
  gigId: Types.ObjectId;
  shiftId: Types.ObjectId;
  date: Date;
  amount: Number;
  type: EnumType;
  userId: Types.ObjectId;
}
