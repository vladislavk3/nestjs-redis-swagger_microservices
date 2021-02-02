import { Document } from 'mongoose';

export interface IAccount extends Document {
  readonly userid: string;
  readonly iban_no: string;
  readonly points: number;
  readonly joinedgames: string[];
  readonly wongames: string[];
  readonly playedgames: string[];
  readonly referal_completed?: boolean;
}
