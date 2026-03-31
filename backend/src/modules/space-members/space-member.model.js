import mongoose from 'mongoose';
import { MEMBERSHIP_STATUS_VALUES } from '../../constants/membership.js';
import { SPACE_ROLE_VALUES } from '../authorization/authorization.constants.js';

const spaceMemberSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    workspaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true,
      index: true
    },
    spaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Space',
      required: true,
      index: true
    },
    role: {
      type: String,
      enum: SPACE_ROLE_VALUES,
      required: true
    },
    status: {
      type: String,
      enum: MEMBERSHIP_STATUS_VALUES,
      default: 'ACTIVE'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

spaceMemberSchema.index({ userId: 1, spaceId: 1 }, { unique: true });
spaceMemberSchema.index({ workspaceId: 1, spaceId: 1, role: 1, status: 1 });

export const SpaceMember = mongoose.model('SpaceMember', spaceMemberSchema);
