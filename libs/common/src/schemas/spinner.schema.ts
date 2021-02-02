import { Schema } from 'mongoose';

const SinnerOptionSchema = new Schema({
  id: {
    type: Number,
    required: true,
  },
  weightage: {
    type: Number,
    required: true,
  },
  prize: {
    points: {
      type: Number,
      required: true,
      default: 0,
    },
    key: {
      type: Number,
      required: true,
      default: 0,
    },
    extra_life_joker: {
      type: Number,
      required: true,
      default: 0,
    },
    two_answer: {
      type: Number,
      required: true,
      default: 0,
    },
    pass_question: {
      type: Number,
      required: true,
      default: 0,
    },
    fifty_fifty: {
      type: Number,
      required: true,
      default: 0,
    },
  },
});

export const SpinnerSchema = new Schema({
  spinnerId: {
    required: true,
    type: Number,
  },
  active: {
    required: true,
    type: Boolean,
    default: false,
  },
  type: {
    required: true,
    type: String,
    enum: ['regular', 'vip'],
    default: 'regular',
  },
  options: [SinnerOptionSchema],
});
