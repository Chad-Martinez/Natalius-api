import { Schema, model } from 'mongoose';
import { IVendor } from '../interfaces/Vendor.interface';

const vendorSchema = new Schema<IVendor>(
  {
    name: {
      type: String,
      required: [true, 'Vendor name is required'],
    },
    defaultType: {
      type: String,
      enum: ['SERVICE', 'EQUIPMENT', 'MISC', ''],
    },
    milage: {
      type: Number,
      default: 0,
    },
    useDefaults: { type: Boolean, default: false },
    notes: String,
    userId: { type: Schema.Types.ObjectId, required: true },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } },
);

vendorSchema.index({ userId: 1, name: 1 });

export default model<IVendor>('Vendor', vendorSchema);
