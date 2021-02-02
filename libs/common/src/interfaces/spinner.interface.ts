import { Document } from 'mongoose';
import { SpinWinType } from './spin-win.interface';

export interface ISpinnerPrize {
  key: number;
  extra_life_joker: number;
  two_answer: number;
  pass_question: number;
  fifty_fifty: number;
  points: number;
}

export interface ISpinnerOptions {
  id: number;
  weightage: number;
  prize: ISpinnerPrize;
}

export interface ISpinner extends Document {
  spinnerId: number;
  active: boolean;
  type: SpinWinType;
  options: ISpinnerOptions[];
}
