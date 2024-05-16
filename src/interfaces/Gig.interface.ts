import { Document, ObjectId } from 'mongodb';

export interface IGig extends Document {
  _id?: ObjectId;
  name: String;
  address?: {
    street: String;
    city: String;
    state: String;
    zip: Number;
  };
  contact?: {
    name: String;
    phone: Number;
  };
  shifts: [ObjectId];
  distance: Number;
  userId: ObjectId;
  created_at?: Date;
  updated_at?: Date;
}
