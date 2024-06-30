import { Schema, model } from 'mongoose';

const accountSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    required: true,
  },
  clubs: [{ type: Schema.Types.ObjectId, default: [] }],
  income: [{ type: Schema.Types.ObjectId, default: [] }],
  expenses: [{ type: Schema.Types.ObjectId, default: [] }],
});

accountSchema.index({ userId: 1 });

export default model('Account', accountSchema);
