import mongoose from 'mongoose';

const boardListSchema = new mongoose.Schema(
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
    name: {
      type: String,
      required: true,
      trim: true
    },
    key: {
      type: String,
      required: true,
      trim: true
    },
    position: {
      type: Number,
      required: true
    },
    kind: {
      type: String,
      default: 'STATUS'
    },
    color: {
      type: String,
      default: '#CBD5E1'
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

boardListSchema.index({ projectId: 1, key: 1 }, { unique: true });
boardListSchema.index({ projectId: 1, position: 1 });

export const BoardList = mongoose.model('BoardList', boardListSchema);
