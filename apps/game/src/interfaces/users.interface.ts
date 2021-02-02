import { Document } from 'mongoose';

export enum Gender {
  male = 'male',
  female = 'female',
  others = 'others',
}

export enum Status {
  review = 'review',
  active = 'active',
  blocked = 'blocked',
}

export enum Role {
  user = 'user',
  admin = 'admin',
  moderator = 'moderator',
}

export interface IUser extends Document {
  readonly userid: string;
  readonly name?: string;
  readonly dob?: string;
  readonly username?: string;
  readonly email?: string;
  readonly avatar?: string;
  readonly gender?: Gender;
  readonly role?: Role;
  readonly mobile?: string;
  readonly status?: Status;
  readonly fcm_token?: string;
  readonly password_set?: boolean;
  readonly hash?: string;
  readonly referal_code?: string;
  readonly referal_by?: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly locale: string;
}
