import * as mongoose from 'mongoose';

export const UserSchema = new mongoose.Schema(
  {
    userid: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
      type: String,
    },
    username: {
      type: String,
      minlength: 3,
      maxlength: 30,
      sparse: true,
      unique: true,
    },
    email: {
      type: String,
      required: false,
      unique: true,
      sparse: true,
    },
    avatar: {
      type: String,
    },
    dob: {
      type: String,
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'others'],
    },
    role: {
      type: String,
      enum: ['user', 'admin', 'moderator'],
      default: 'user',
    },
    mobile: {
      type: String,
      required: true,
      unique: true,
    },
    status: {
      type: String,
      enum: ['review', 'active', 'blocked'],
      required: true,
      default: 'active',
    },
    fcm_token: {
      type: String,
      default: '',
    },
    password_set: {
      type: Boolean,
      default: false,
    },
    hash: {
      type: String,
    },
    referal_code: {
      type: String,
      unique: true,
    },
    referal_by: {
      type: String,
    },
    locale: {
      type: String,
      default: 'en',
    },
  },
  {
    autoIndex: true,
    timestamps: true,
  },
);

UserSchema.index({
  mobile: 'text',
  name: 'text',
  username: 'text',
  email: 'text',
});
