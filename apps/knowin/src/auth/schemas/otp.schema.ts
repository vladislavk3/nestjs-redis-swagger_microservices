import * as mongoose from 'mongoose';

export const OtpSchema = new mongoose.Schema(
  {
    otp: {
      type: Number,
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

OtpSchema.index(
  {
    createdAt: 1,
  },
  {
    expireAfterSeconds: 300,
  },
);
