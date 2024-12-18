import { Types } from 'mongoose';
import { EnumType } from 'typescript';

export interface IVendor {
  name: string;
  defaultType: EnumType;
  milage: number;
  useDefaults: boolean;
  notes?: number;
  userId: Types.ObjectId;
}
