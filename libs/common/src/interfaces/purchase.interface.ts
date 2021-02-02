import { Document } from 'mongoose';

export interface IPurchase extends Document {
  readonly userid: string;
  readonly productId: string;
  readonly purchaseToken: string;
  readonly orderId: boolean;
  readonly refundMade: boolean;
  readonly coinPurchase: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
}
