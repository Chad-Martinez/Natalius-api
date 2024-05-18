import { Types } from 'mongoose';
import { EnumType } from 'typescript';

export interface IVendor {
  name: string;
  defaultType: EnumType;
  userId: Types.ObjectId;
}
