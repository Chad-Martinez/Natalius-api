import { UploadApiResponse } from 'cloudinary';
import { Types } from 'mongoose';
import { EnumType } from 'typescript';

export interface IShiftExpenses {
  floorFee: Number;
  dances: {
    numOfDances: Number;
    pricePerDance: Number;
    danceFeeTotal: Number;
  };
  tips: Number;
  other: Number;
  totalShiftExpenses: Number;
  type: String;
}

export interface IShiftIncome {
  amount: Number;
  type: EnumType;
}

export interface IShiftBase {
  start: Date;
  end: Date;
  timezone: String;
  notes: String;
  shiftComplete: boolean;
  clubId: Types.ObjectId;
  expenses?: IShiftExpenses;
  income: IShiftIncome;
  image: UploadApiResponse | undefined;
  milage: Number;
  userId: Types.ObjectId;
}

export interface IShift extends IShiftBase {
  _id: Types.ObjectId;
  clubName?: String;
}
