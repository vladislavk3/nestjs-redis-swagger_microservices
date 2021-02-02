import { Document } from 'mongoose';

export interface ISettings extends Document {
  isMaintenance: boolean;
  version: string;
}
