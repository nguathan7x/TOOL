import mongoose from 'mongoose';
import { MEMBERSHIP_STATUS_VALUES } from '../../constants/membership.js';
import { WORKSPACE_ROLE_VALUES } from '../authorization/authorization.constants.js';

const workspaceMemberSchema = new mongoose.Schema(
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
    role: {
      type: String,
      enum: WORKSPACE_ROLE_VALUES,
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

workspaceMemberSchema.index({ userId: 1, workspaceId: 1 }, { unique: true });
workspaceMemberSchema.index({ workspaceId: 1, role: 1, status: 1 });

export const WorkspaceMember = mongoose.model('WorkspaceMember', workspaceMemberSchema);
