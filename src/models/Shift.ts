import { Schema, model } from 'mongoose';
import { IShift } from 'src/interfaces/Shift.interface';

const shiftSchema = new Schema<IShift>(
  {
    gigId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'Gig',
    },
    start: {
      type: Date,
      required: [true, 'Start date and time required'],
    },
    end: {
      type: Date,
      required: [true, 'End date and time required'],
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
