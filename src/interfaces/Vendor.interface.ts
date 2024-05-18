import { Types } from 'mongoose';

export interface IVendor {
  name: string;
  defaultType: string;
  userId: Types.ObjectId;
}
