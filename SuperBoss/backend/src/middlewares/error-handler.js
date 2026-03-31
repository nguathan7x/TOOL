import { HTTP_STATUS } from '../constants/http-status.js';
import { sendError } from '../shared/http/response.js';

export function errorHandler(error, req, res, next) {
  const statusCode = error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
  const message = error.message || 'Internal server error';
  const details = error.details || null;

  if (process.env.NODE_ENV !== 'test') {
    console.error(error);
  }

  return sendError(res, statusCode, message, details);
}
