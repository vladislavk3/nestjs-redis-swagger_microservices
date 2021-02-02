import { Document } from 'mongoose';

export type ITransactionStatus = 'paid' | 'pending' | 'canceled' | 'failed';

export interface ITransaction extends Document {
  transaction_id: string;
  userid: string;
  exchange_rate: number;
  points: number;
  doller: number;
  message: string;
  status: ITransactionStatus;
  createdAt: Date;
  updatedAt: Date;
  iban_no: string;
  name: string;
  mobile: string;
}
