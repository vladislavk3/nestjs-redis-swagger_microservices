import { Document } from 'mongoose';
import { RewardType } from 'knowin/common';

export interface IQuestionsPlayedGame {
  number: number;
  title: string;
  option1: string;
  option2: string;
  option3: string;
  option4: string;
  correct: number;
}

export interface IPowerUpPlayedGame {
  extra_life_joker: number;
  fifty_fifty: number;
  pass_question: number;
  two_answer: number;
}

export interface IUsersPlayedGame {
  userid: string;
  username: string;
  powerUpUsedNo: any[];
  avatar: string;
  answerGiven: Array<string | number>;
  correctGiven: Array<string | number>;
  powerUpUsed: IPowerUpPlayedGame;
}

export interface IPlayedGame extends Document {
  quizid: string;
  questionData: IQuestionsPlayedGame[];
  userData: IUsersPlayedGame[];
  playedTime: Date;
  reward_type: RewardType;
  entryfee: number;
  winningprice: number;
  roomsize: number;
  category: string;
}
