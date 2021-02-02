import { Document } from 'mongoose';

export interface IPointsWon {
  date: string;
  points: number;
}

export interface IAnalytics extends Document {
  userid: string;
  points_won: IPointsWon[];
  total_earned: number;
}
