import { Schema } from 'mongoose';

export const TransactionSchema = new Schema(
  {
    transaction_id: {
      type: String,
      required: true,
      unique: true,
    },
    userid: {
      type: String,
      required: true,
    },
    exchange_rate: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'paid', 'canceled', 'failed'],
      default: 'pending',
    },
    message: {
      type: String,
      default: '',
    },
    points: {
      type: Number,
      required: true,
    },
    doller: {
      type: Number,
      required: true,
    },
    iban_no: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    mobile: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);
