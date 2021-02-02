import { Document } from 'mongoose';
import { IUser } from 'knowin/common';

export interface IDateGroup {
  start: string;
  end: string;
}

export interface IUsersInBoard {
  points: number;
  won: number;
  userinfo: IUser;
}

export interface ILeaderBoard extends Document {
  date: IDateGroup;
  usersList: IUsersInBoard[];
}
