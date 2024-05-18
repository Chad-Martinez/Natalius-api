import { Schema, model } from 'mongoose';

const vendorSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Vendor name is required'],
    },
    defaultType: {
      type: String,
      enum: ['SERVICE', 'EQUIPMENT', 'MISC', 'NONE'],
      default: 'NONE',
    },
    userId: { type: Schema.Types.ObjectId, required: true },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } },
);

vendorSchema.index({ userId: 1, name: 1 });

export default model('Vendor', vendorSchema);
