import { Document } from 'mongoose';

export enum SpinWinType {
  regular = 'regular',
  vip = 'vip',
}

export interface ISpinWin extends Document {
  userid: string;
  gamePlayed: number;
  type: SpinWinType;
}
