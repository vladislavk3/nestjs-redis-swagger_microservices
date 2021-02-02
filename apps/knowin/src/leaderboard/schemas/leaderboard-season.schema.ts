import { Schema } from 'mongoose';

export const LeaderBoardSeasonSchema = new Schema({
  start_date: {
    type: Date,
    required: true,
  },
  end_date: {
    type: Date,
    required: true,
  },
  points: {
    type: Number,
    default: 0.0,
  },
  won: {
    type: Number,
    default: 0.0,
  },
  userid: {
    type: String,
  },
});
