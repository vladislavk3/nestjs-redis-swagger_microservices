import { Schema } from 'mongoose';

export const SettingsSchema = new Schema({
  isMaintenance: {
    type: Boolean,
  },
  version: {
    type: String,
  },
});
