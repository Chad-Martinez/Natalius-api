import { Schema, SchemaTypes } from 'mongoose';

const gigSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Gig name is required'],
    },
    address: {
      street: String,
      city: String,
      state: String,
      zip: Number,
    },
    contact: {
      name: String,
      phone: {
        type: Number,
        min: [10, 'Phone number must be at least 10 digits'],
        max: [10, 'Phone number cannot be greater than 10 digits'],
      },
    },
    shifts: [
      {
        date: {
          type: Date,
          default: Date.now,
        },
        startTime: {
          type: Date,
          required: [true, 'Start time required'],
        },
        endTime: {
          type: Date,
          required: [true, 'End time required'],
        },
        notes: String,
      },
    ],
    distance: Number,
    userId: { type: SchemaTypes.ObjectId, required: true },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } },
);

gigSchema.index({ userId: 1 });

export default gigSchema;
