import mongoose from 'mongoose';
import { TASK_PRIORITY_VALUES, TASK_TYPES, TASK_TYPE_VALUES } from '../../constants/task.js';

const checklistItemSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    isCompleted: {
      type: Boolean,
      default: false
    },
    completedAt: {
      type: Date,
      default: null
    }
  },
  { _id: true }
);

const taskSchema = new mongoose.Schema(
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
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      index: true
    },
    boardListId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BoardList',
      default: null,
      index: true
    },
    parentTaskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
      default: null,
      index: true
    },
    taskType: {
      type: String,
      enum: TASK_TYPE_VALUES,
      default: TASK_TYPES.TASK
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      default: ''
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true
    },
    status: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    priority: {
      type: String,
      enum: TASK_PRIORITY_VALUES,
      default: 'MEDIUM'
    },
    assigneeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true
    },
    reporterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    labels: {
      type: [String],
      default: []
    },
    startDate: {
      type: Date,
      default: null
    },
    dueDate: {
      type: Date,
      default: null
    },
    estimateHours: {
      type: Number,
      default: null
    },
    checklist: {
      type: [checklistItemSchema],
      default: []
    },
    dependencyTaskIds: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: 'Task',
      default: []
    },
    sequenceNumber: {
      type: Number,
      required: true
    },
    backlogRank: {
      type: Number,
      default: null,
      index: true
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

taskSchema.index({ projectId: 1, sequenceNumber: 1 }, { unique: true });
taskSchema.index({ projectId: 1, boardListId: 1, status: 1 });
taskSchema.index({ projectId: 1, assigneeId: 1 });
taskSchema.index({ projectId: 1, backlogRank: 1 });

export const Task = mongoose.model('Task', taskSchema);
