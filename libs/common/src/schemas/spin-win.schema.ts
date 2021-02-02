import { Schema } from 'mongoose';

export const SpinWinSchema = new Schema({
  userid: {
    required: true,
    type: String,
  },
  gamePlayed: {
    required: true,
    type: Number,
    default: 1,
  },
  type: {
    required: true,
    type: String,
    enum: ['regular', 'vip'],
    default: 'regular',
  },
});

SpinWinSchema.index({ userid: 1, type: 1 }, { unique: true });
