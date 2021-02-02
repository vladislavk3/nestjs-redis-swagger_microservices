import * as mongoose from 'mongoose';
// This document will be genrated for each purchase a user makes
// by verifed it means that the product was verifed and
// was added to the list products user have

export const PurchaseSchema = new mongoose.Schema(
  {
    userid: {
      type: String,
      required: true,
    },
    orderId: {
      type: String,
      unique: true,
      sparse: true,
    },
    productId: {
      type: String,
      required: true,
    },
    purchaseToken: {
      type: String,
      unique: true,
      sparse: true,
    },
    refundMade: {
      type: Boolean,
      default: false,
    },
    coinPurchase: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);
