import * as mongoose from 'mongoose';

export const ProductsSchema = new mongoose.Schema({
  userid: {
    type: String,
    required: true,
  },
  productid: {
    type: String,
    required: true,
  },
  count: {
    type: Number,
    default: 0,
  },
});

ProductsSchema.index({ userid: 1, productid: 1 }, { unique: true });
