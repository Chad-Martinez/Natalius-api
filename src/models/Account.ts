import { Schema, model, SchemaTypes } from 'mongoose';

const accountSchema = new Schema({
  userId: {
    type: SchemaTypes.ObjectId,
    required: true,
  },
  gigs: [{ type: SchemaTypes.ObjectId, default: [] }],
  income: [{ type: SchemaTypes.ObjectId, default: [] }],
  expenses: [{ type: SchemaTypes.ObjectId, default: [] }],
});

accountSchema.index({ userId: 1 });

export default model('Account', accountSchema);
