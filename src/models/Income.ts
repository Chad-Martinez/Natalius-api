import { Schema, SchemaTypes, model } from 'mongoose';

const incomeSchema = new Schema(
  {
    gigId: {
      type: SchemaTypes.ObjectId,
      required: [true, 'Gig is required'],
    },
    date: {
      type: Date,
      default: Date.now,
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0.01, 'Amount has to be at least $0.01'],
    },
    type: {
      type: String,
      enum: ['Cash', 'Check', 'Credit'],
      required: [true, 'Payment Type is required'],
    },
    userId: { type: SchemaTypes.ObjectId, required: true },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } },
);

incomeSchema.index({ userId: 1 });

export default model('Income', incomeSchema);
