import { Schema, model } from 'mongoose';
import { IShift } from 'src/interfaces/Shift.interface';

const shiftSchema = new Schema<IShift>(
  {
    gigId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'Gig',
    },
    startDate: {
      type: Date,
      required: [true, 'Start date required'],
    },
    startTime: {
      type: Date,
      required: [true, 'Start time required'],
    },
    endDate: {
      type: Date,
      required: [true, 'End date required'],
    },
    endTime: {
      type: Date,
      required: [true, 'End time required'],
    },
    notes: {
      type: String,
      default: '',
    },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } },
);

shiftSchema.index({ gigId: 1, stateDate: 1, startTime: 1 });

export default model<IShift>('Shift', shiftSchema);
