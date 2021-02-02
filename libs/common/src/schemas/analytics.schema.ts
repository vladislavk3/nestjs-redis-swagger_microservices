import { Schema } from 'mongoose';

export const AnalyticsSchema = new Schema({
  userid: {
    type: String,
    unique: true,
  },

  points_won: [
    {
      date: {
        type: Date,
        required: true,
      },
      points: {
        type: Number,
        required: true,
      },
    },
  ],

  total_earned: {
    type: Number,
    required: true,
    default: 0,
  },
});
