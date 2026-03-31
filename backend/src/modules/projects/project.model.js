import mongoose from 'mongoose';
import { TASK_TYPE_VALUES, TASK_TYPES } from '../../constants/task.js';

export const PROJECT_LIFECYCLE_STATUSES = {
  ACTIVE: 'ACTIVE',
  ON_HOLD: 'ON_HOLD',
  COMPLETED: 'COMPLETED',
  ARCHIVED: 'ARCHIVED'
};

const PROJECT_LIFECYCLE_STATUS_VALUES = Object.values(PROJECT_LIFECYCLE_STATUSES);

const projectStatusColumnSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      trim: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    color: {
      type: String,
      default: '#CBD5E1'
    },
    position: {
      type: Number,
      required: true
    }
  },
  { _id: false }
);

const workflowTransitionSchema = new mongoose.Schema(
  {
    from: {
      type: String,
      required: true,
      trim: true
    },
    to: {
      type: String,
      required: true,
      trim: true
    },
    allowedRoles: {
      type: [String],
      default: undefined
    }
  },
  { _id: false }
);

const projectSchema = new mongoose.Schema(
  {
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
    name: {
      type: String,
      required: true,
      trim: true
    },
    key: {
      type: String,
      required: true,
      trim: true,
      uppercase: true
    },
    description: {
      type: String,
      default: ''
    },
    status: {
      type: String,
      enum: PROJECT_LIFECYCLE_STATUS_VALUES,
      default: PROJECT_LIFECYCLE_STATUSES.ACTIVE,
      index: true
    },
    startDate: {
      type: Date,
      default: null
    },
    targetEndDate: {
      type: Date,
      default: null
    },
    completedAt: {
      type: Date,
      default: null
    },
    archivedAt: {
      type: Date,
      default: null
    },
    completionNote: {
      type: String,
      default: ''
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true
    },
    statusColumns: {
      type: [projectStatusColumnSchema],
      default: []
    },
    workflowTransitions: {
      type: [workflowTransitionSchema],
      default: []
    },
    supportedTaskTypes: {
      type: [String],
      enum: TASK_TYPE_VALUES,
      default: [TASK_TYPES.TASK]
    },
    defaultTaskType: {
      type: String,
      enum: TASK_TYPE_VALUES,
      default: TASK_TYPES.TASK
    },
    isArchived: {
      type: Boolean,
      default: false,
      index: true
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

projectSchema.index({ spaceId: 1, key: 1 }, { unique: true });
projectSchema.index({ workspaceId: 1, spaceId: 1, name: 1 });

export const Project = mongoose.model('Project', projectSchema);
