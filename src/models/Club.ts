import { Schema, model } from 'mongoose';
import { IClub } from '../interfaces/Club.interface';

const clubSchema = new Schema<IClub>(
  {
    name: {
      type: String,
      required: [true, 'Club name is required'],
    },
    address: {
      street: String,
      city: String,
      state: String,
      zip: Number,
    },
    contact: {
      name: String,
      phone: {
        type: String,
        validate: {
          validator: (v: string) => {
            if (/\d{3}-\d{3}-\d{4}/.test(v) || v === null) return true;
            else return false;
          },
          message: 'Supplied phone number is not a valid phone number',
        },
      },
    },
    defaults: {
      useDefaults: { type: Boolean, default: false },
      floorFee: Number,
      pricePerDance: Number,
      tips: Number,
      other: Number,
      milage: { type: Number, default: 0 },
      timezone: String,
    },
    shifts: [{ type: Schema.Types.ObjectId, ref: 'Shift', default: [] }],
    milage: { type: Number, default: 0 },
    userId: { type: Schema.Types.ObjectId, required: true },
    isArchived: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } },
);

clubSchema.index({ userId: 1 });

export default model<IClub>('Club', clubSchema);
