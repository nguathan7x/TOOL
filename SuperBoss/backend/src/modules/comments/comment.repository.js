import { Comment } from './comment.model.js';
import { Task } from '../tasks/task.model.js';
import { Project } from '../projects/project.model.js';

const AUTHOR_POPULATE_SELECT = 'fullName email avatarUrl globalRole userType specialization isActive';

export class CommentRepository {
  findTaskById(taskId) {
    return Task.findById(taskId);
  }

  findProjectById(projectId) {
    return Project.findById(projectId);
  }

  findCommentsByTask(taskId, pagination) {
    return Comment.find({ taskId })
      .populate('authorId', AUTHOR_POPULATE_SELECT)
      .sort({ createdAt: -1 })
      .skip(pagination.skip)
      .limit(pagination.limit);
  }

  countCommentsByTask(taskId) {
    return Comment.countDocuments({ taskId });
  }

  createComment(payload) {
    return Comment.create(payload);
  }

  findCommentById(commentId) {
    return Comment.findById(commentId).populate('authorId', AUTHOR_POPULATE_SELECT);
  }
}

export const commentRepository = new CommentRepository();
