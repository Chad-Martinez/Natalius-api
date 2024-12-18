import { Schema, model } from 'mongoose';
import { IExpense } from '../interfaces/Expense.interface';

const expenseSchema = new Schema<IExpense>(
  {
    vendorId: {
      type: Schema.Types.ObjectId,
      required: [true, 'Vendor is Required'],
      ref: 'Vendor',
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
      enum: ['SERVICE', 'EQUIPMENT', 'MISC'],
      required: [true, 'Expense type is required'],
      uppercase: true,
    },
    milage: { type: Number, default: 0 },
    notes: String,
    userId: { type: Schema.Types.ObjectId, required: true },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } },
);

expenseSchema.index({ userId: 1, date: 1 });

export default model<IExpense>('Expense', expenseSchema);
