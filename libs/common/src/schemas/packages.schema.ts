import * as mongoose from 'mongoose';

export const PackagesSchema = new mongoose.Schema({
  packageId: {
    type: String,
    required: true,
    unique: true,
  },
  title: {
    type: String,
    required: true,
  },
  heartCount: {
    type: Number,
    required: true,
    default: 0,
  },
  passCount: {
    type: Number,
    required: true,
    default: 0,
  },
  fiftyFiftyCount: {
    type: Number,
    required: true,
    default: 0,
  },
  twoAnswerCount: {
    type: Number,
    required: true,
    default: 0,
  },
  keyCount: {
    type: Number,
    required: true,
    default: 0,
  },
  price: {
    type: Number,
    required: true,
    default: 0,
  },
  priceSold: {
    type: Number,
    required: true,
    default: 0,
  },
  type: {
    type: String,
    enum: ['package', 'heart', 'pass', 'two_answer', 'fifty_fifty', 'key'],
    required: true,
  },
  isOffer: {
    type: Boolean,
    required: true,
    default: false,
  },
  discountPercent: {
    type: Number,
  },
  purchaseMode: {
    type: String,
    enum: ['coin', 'money'],
  },
  validTill: {
    type: Date,
  },
});
