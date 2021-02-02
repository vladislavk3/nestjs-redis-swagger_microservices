import * as mongoose from 'mongoose';

export const AccountSchema = new mongoose.Schema({
  userid: {
    type: String,
    required: true,
    unique: true,
  },
  points: {
    type: Number,
    required: true,
    default: 0,
  },
  iban_no: {
    type: String,
    default: '',
  },
  joinedgames: {
    type: [String],
    required: true,
    default: [],
  },
  wongames: {
    type: [String],
    required: true,
    default: [],
  },
  playedgames: {
    type: [String],
    required: true,
    default: [],
  },
  // new field set true if the users referent recived his reward
  referal_completed: {
    type: Boolean,
    default: false,
  },
});
