import { Schema, model } from 'mongoose';
import { ISprint } from '../interfaces/Sprint.interface';

const sprintSchema = new Schema<ISprint>(
  {
    start: {
      type: Date,
      required: [true, 'Start date is requried'],
    },
    end: {
      type: Date,
      required: [true, 'End date is required'],
    },
    goal: {
      type: Number,
      required: [true, 'Sprint goal is required'],
      min: [1, 'Minimum of $1'],
    },
    incomes: [{ type: Schema.Types.ObjectId, ref: 'Income', default: [] }],
    isCompleted: {
      type: Boolean,
      default: false,
    },
    goalMet: {
      type: Boolean,
      default: false,
    },
    total: {
      type: Number,
    },
    userId: { type: Schema.Types.ObjectId, required: true },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } },
);

sprintSchema.index({ userId: 1, isCompleted: 1 });

export default model<ISprint>('Sprint', sprintSchema);
