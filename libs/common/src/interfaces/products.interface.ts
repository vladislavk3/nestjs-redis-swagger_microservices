import { Document } from 'mongoose';

export type PowerUp =
  | 'atom_package'
  | 'giant_package'
  | 'rich_package'
  | 'medium_package'
  | 'mini_package'
  | 'standard_package'
  | 'one_extra_life_joker'
  | 'three_extra_life_joker'
  | 'five_extra_life_joker'
  | 'ten_extra_life_joker'
  | 'fifteen_extra_life_joker'
  | 'one_pass_question'
  | 'three_pass_question'
  | 'five_pass_question'
  | 'ten_pass_question'
  | 'fifteen_pass_question'
  | 'one_two_answer'
  | 'three_two_answer'
  | 'five_two_answer'
  | 'ten_two_answer'
  | 'fifteen_two_answer'
  | 'one_fifty_fifty'
  | 'three_fifty_fifty'
  | 'five_fifty_fifty'
  | 'ten_fifty_fifty'
  | 'fifteen_fifty_fifty';

export const powerUpList = [
  'atom_package',
  'giant_package',
  'rich_package',
  'medium_package',
  'mini_package',
  'standard_package',
  'one_extra_life_joker',
  'three_extra_life_joker',
  'five_extra_life_joker',
  'ten_extra_life_joker',
  'fifteen_extra_life_joker',
  'one_pass_question',
  'three_pass_question',
  'five_pass_question',
  'ten_pass_question',
  'fifteen_pass_question',
  'one_two_answer',
  'three_two_answer',
  'five_two_answer',
  'ten_two_answer',
  'fifteen_two_answer',
  'one_fifty_fifty',
  'three_fifty_fifty',
  'five_fifty_fifty',
  'ten_fifty_fifty',
  'fifteen_fifty_fifty',
];

export enum IProductTypes {
  key = 'key',
  extra_life_joker = 'extra_life_joker',
  two_answer = 'two_answer',
  pass_question = 'pass_question',
  fifty_fifty = 'fifty_fifty',
}

export interface IProducts extends Document {
  readonly userid: string;
  readonly productid: IProductTypes;
  readonly count: number;
}
