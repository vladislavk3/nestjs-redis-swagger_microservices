import { Document } from 'mongoose';

export interface IUI extends Document {
  name: string;
  type: string;
}
