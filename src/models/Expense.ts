import { Schema, model } from 'mongoose';

const expenseSchema = new Schema(
  {
    vendorId: {
      type: Schema.Types.ObjectId,
      required: [true, 'Vendor is Required'],
    },
    date: {
      type: Date,
      default: Date.now,
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0.01, 'Minimum of 0.01'],
    },
    type: {
      type: String,
      required: [true, 'Expense type is required'],
    },
    userId: { type: Schema.Types.ObjectId, required: true },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } },
);

expenseSchema.index({ userId: 1, date: 1 });

export default model('Expense', expenseSchema);
