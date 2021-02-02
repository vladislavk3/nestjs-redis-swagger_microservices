import { Document } from 'mongoose';

export interface IOtp extends Document {
  readonly otp: number;
  readonly mobile: string;
}
