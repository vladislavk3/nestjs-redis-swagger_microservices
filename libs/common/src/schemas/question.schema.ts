import * as mongoose from 'mongoose';

export const QuestionSchema = new mongoose.Schema({
  questionid: {
    type: String,
    required: true,
    unique: true,
  },
  title: {
    type: String,
    required: true,
  },
  options: [{ value: String, key: Number }],

  answerKey: {
    type: Number,
    required: true,
  },

  level: {
    type: String,
    required: true,
    enum: ['practice', 'medium', 'easy', 'hard'],
    default: 'practice',
  },

  tags: {
    type: [String],
  },

  win: {
    type: Number,
    default: 0,
  },

  played: {
    type: Number,
    default: 0,
  },
});

QuestionSchema.index({ title: 'text' });
