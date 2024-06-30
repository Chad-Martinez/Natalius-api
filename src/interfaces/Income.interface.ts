import { Types } from 'mongoose';
import { EnumType } from 'typescript';

interface IIncomeBase {
  shiftId?: Types.ObjectId;
  date: Date;
  amount: Number;
  type: EnumType;
  userId: Types.ObjectId;
}

export interface IIncome extends IIncomeBase {
  clubId: Types.ObjectId;
  _id: Types.ObjectId;
}

export interface IIncomePopulated extends IIncomeBase {
  clubId?: {
    _id: Types.ObjectId;
    name: String;
  };
  created_at: Date;
  updated_at: Date;
}
