import mongoose from 'mongoose';
import {
  GLOBAL_ROLE_VALUES,
  USER_SPECIALIZATION_VALUES,
  USER_TYPE_VALUES
} from '../../constants/user.js';

const PROFILE_GENDER_VALUES = ['MALE', 'FEMALE', 'NON_BINARY', 'PREFER_NOT_TO_SAY'];

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true
    },
    passwordHash: {
      type: String,
      required: true
    },
    googleSubject: {
      type: String,
      default: null,
      index: true,
      sparse: true
    },
    avatarUrl: {
      type: String,
      default: null
    },
    phone: {
      type: String,
      default: null,
      trim: true
    },
    birthday: {
      type: Date,
      default: null
    },
    gender: {
      type: String,
      enum: PROFILE_GENDER_VALUES,
      default: null
    },
    address: {
      type: String,
      default: null,
      trim: true
    },
    bio: {
      type: String,
      default: null,
      trim: true
    },
    globalRole: {
      type: String,
      enum: GLOBAL_ROLE_VALUES,
      default: undefined
    },
    userType: {
      type: String,
      enum: USER_TYPE_VALUES,
      default: 'INTERNAL'
    },
    specialization: {
      type: String,
      enum: USER_SPECIALIZATION_VALUES,
      default: 'DEV'
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true
    },
    refreshTokenVersion: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

export const User = mongoose.model('User', userSchema);
