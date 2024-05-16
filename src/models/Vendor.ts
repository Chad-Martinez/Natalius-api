import { Schema, model } from 'mongoose';

const vendorSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Vendor name is required'],
    },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } },
);

vendorSchema.index({ name: 1 });

export default model('Vendor', vendorSchema);
