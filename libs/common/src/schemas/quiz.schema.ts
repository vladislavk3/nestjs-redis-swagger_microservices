import * as mongoose from 'mongoose';

export const QuizSchema = new mongoose.Schema({
  quizid: {
    type: String,
    required: true,
    unique: true,
  },
  starttime: {
    type: Date,
    required: true,
  },
  questionlist: {
    type: [String],
    required: true,
  },
  roomsize: {
    type: Number,
    required: true,
  },
  joinedusers: {
    type: [String],
    default: [],
  },
  //type: {
  //type: String,
  //enum: ['reward', 'live'],
  //},
  category: {
    type: String,
    required: true,
  },
  winningprice: {
    type: Number,
    required: true,
  },
  reward_type: {
    type: String,
    enum: ['question_win', 'game_win'],
    default: 'game_win',
  },
  entryfee: {
    type: Number,
    required: true,
  },
  banner: {
    type: String,
  },
  status: {
    type: String,
    enum: ['pending', 'queued', 'running', 'finished'],
    default: 'pending',
  },
});
