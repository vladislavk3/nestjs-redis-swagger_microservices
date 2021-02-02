import { Document } from 'mongoose';

export interface IEmailVerify extends Document {
  forEmail: string;
  otp: number;
  userid: string;
}
