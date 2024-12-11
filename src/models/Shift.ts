import { Schema, model } from 'mongoose';
import { IShift } from '../interfaces/Shift.interface';

const shiftSchema = new Schema<IShift>(
  {
    clubId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'Club',
    },
    start: {
      type: Date,
      required: [true, 'Start date and time required'],
    },
    end: {
      type: Date,
      required: [true, 'End date and time required'],
    },
    timezone: {
      type: String,
      required: [true, 'Timezone required'],
    },
    shiftComplete: {
      type: Boolean,
      default: false,
    },
    notes: {
      type: String,
      default: '',
    },
    expenses: {
      floorFee: {
        type: Number,
      },
      dances: {
        numOfDances: {
          type: Number,
        },
        pricePerDance: {
          type: Number,
        },
        danceFeeTotal: {
          type: Number,
        },
      },
      tips: {
        type: Number,
      },
      other: {
        type: Number,
      },
      totalShiftExpenses: {
        type: Number,
      },
      type: {
        type: String,
      },
    },
    income: {
      amount: {
        type: Number,
        default: 0,
      },
      type: {
        type: String,
        default: 'CASH',
      },
    },
    image: Object,
    milage: {
      type: Number,
      default: 0,
    },
    userId: { type: Schema.Types.ObjectId, required: true },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } },
);

shiftSchema.index({ clubId: 1, stateDate: 1, startTime: 1 });

export default model<IShift>('Shift', shiftSchema);
