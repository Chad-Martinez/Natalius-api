import { Schema, SchemaTypes, model } from 'mongoose';

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
        type: String,
        validate: {
          validator: (v: string) => {
            return /\d{3}-\d{3}-\d{4}/.test(v);
          },
          message: 'Supplied phone number is not a valid phone number',
        },
      },
    },
    shifts: [{ type: SchemaTypes.ObjectId, ref: 'Shift' }],
    distance: Number,
    userId: { type: SchemaTypes.ObjectId, required: true },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } },
);

gigSchema.index({ userId: 1 });

export default model('Gig', gigSchema);
