import { Schema, model } from 'mongoose';
import { IGig } from 'src/interfaces/Gig.interface';

const gigSchema = new Schema<IGig>(
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
        type: String,
        validate: {
          validator: (v: string) => {
            return /\d{3}-\d{3}-\d{4}/.test(v);
          },
          message: 'Supplied phone number is not a valid phone number',
        },
      },
    },
    shifts: [{ type: Schema.Types.ObjectId, ref: 'Shift', default: [] }],
    distance: Number,
    userId: { type: Schema.Types.ObjectId, required: true },
    isArchived: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } },
);

gigSchema.index({ userId: 1 });

export default model<IGig>('Gig', gigSchema);
