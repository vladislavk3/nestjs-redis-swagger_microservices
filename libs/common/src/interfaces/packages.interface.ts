import { Document } from 'mongoose';

export enum PackageType {
  package = 'package',
  heart = 'heart',
  pass = 'pass',
  two_asnwer = 'two_asnwer',
  fifty_fifty = 'fifty_fifty',
  key = 'key',
}

export enum PurchaseMode {
  coin = 'coin',
  money = 'money',
}

export interface IPackage extends Document {
  readonly packageId: string;
  readonly title: string;
  readonly heartCount: number;
  readonly passCount: number;
  readonly fiftyFiftyCount: number;
  readonly twoAnswerCount: number;
  readonly keyCount: number;
  readonly purchaseMode: PurchaseMode;
  readonly price: number;
  readonly priceSold: number;
  readonly type: PackageType;
  readonly isOffer: boolean;
  readonly discountPercent: number;
  readonly validTill: Date;
}
