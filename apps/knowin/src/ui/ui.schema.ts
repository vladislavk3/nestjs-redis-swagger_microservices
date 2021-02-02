import * as mongoose from 'mongoose';

export const UiScheme = new mongoose.Schema({
  name: {
    type: String,
  },
  type: {
    type: String,
    enum: ['tag', 'category'],
  },
});

UiScheme.index({ name: 1, type: 1 }, { unique: true });
