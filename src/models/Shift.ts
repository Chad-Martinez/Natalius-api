import { Schema, model, SchemaTypes } from 'mongoose';

const shiftSchema = new Schema(
  {
    gigId: {
      type: SchemaTypes.ObjectId,
      required: true,
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

shiftSchema.index({ gigId: 1 });

export default model('Shift', shiftSchema);
