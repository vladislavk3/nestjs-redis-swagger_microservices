import { Document } from 'mongoose';

export enum Level {
  practice = 'practice',
  easy = 'easy',
  hard = 'hard',
  medium = 'medium',
}

export interface IQuestion extends Document {
  readonly questionid: string;
  readonly title: string;
  readonly options: IOptions;
  readonly answerkey: number;
  readonly level: Level;
  readonly tags: string[];
  readonly win: number;
  readonly played: number;
}

export interface IOptions extends Document {
  readonly key: string;
  readonly value: number;
}
