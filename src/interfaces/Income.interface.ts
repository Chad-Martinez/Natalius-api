import { Types } from 'mongoose';
import { EnumType } from 'typescript';

interface IIncomeBase {
  shiftId: Types.ObjectId;
  date: Date;
  amount: Number;
  type: EnumType;
  userId: Types.ObjectId;
}

export interface IIncome extends IIncomeBase {
  gigId: Types.ObjectId;
}

export interface IIncomePopulated extends IIncomeBase {
  gigId?: {
    _id: Types.ObjectId;
    name: String;
  };
  created_at: Date;
  updated_at: Date;
}
