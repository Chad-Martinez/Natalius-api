import { Schema, model } from 'mongoose';
import { IIncome, IIncomePopulated } from 'src/interfaces/Income.interface';

const incomeSchema = new Schema<IIncome | IIncomePopulated>(
  {
    gigId: {
      type: Schema.Types.ObjectId,
      required: [true, 'Gig is required'],
      ref: 'Gig',
    },
    shiftId: {
      type: Schema.Types.ObjectId,
      ref: 'Shift',
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
      enum: ['CASH', 'CHECK', 'CREDIT'],
      required: [true, 'Payment Type is required'],
    },
    userId: { type: Schema.Types.ObjectId, required: true },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } },
);

incomeSchema.index({ userId: 1, date: 1 });

export default model<IIncome | IIncomePopulated>('Income', incomeSchema);
