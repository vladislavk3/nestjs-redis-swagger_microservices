import { Document } from 'mongoose';

export enum StatusType {
  pending = 'pending',
  queued = 'queued',
  running = 'running',
  finised = 'finished',
  cancelled = 'cancelled',
}

export enum RewardType {
  question_win = 'question_win',
  game_win = 'game_win',
}

export interface IQuiz extends Document {
  readonly quizid: string;
  readonly starttime: Date;
  readonly questionlist: string[];
  readonly roomsize: number;
  readonly joinedusers: string[];
  readonly quizsize: number;
  readonly winningprice: number;
  readonly entryfee: number;
  readonly category: string;
  readonly status: StatusType;
  readonly reward_type: RewardType;
}
