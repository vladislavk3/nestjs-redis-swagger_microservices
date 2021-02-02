import * as mongoose from 'mongoose';

export const EmailVerifySchema = new mongoose.Schema(
  {
    forEmail: {
      type: String,
      required: true,
    },
    otp: {
      type: Number,
      required: true,
    },
    userid: {
      type: String,
      required: true,
    },
  },

  {
    timestamps: true,
  },
);

EmailVerifySchema.index(
  {
    createdAt: 1,
  },
  {
    expireAfterSeconds: 3000,
  },
);
