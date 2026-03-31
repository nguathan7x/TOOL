import { APP_MESSAGES } from '../constants/app.js';
import { HTTP_STATUS } from '../constants/http-status.js';
import { sendError } from '../shared/http/response.js';

export function notFoundHandler(req, res) {
  return sendError(res, HTTP_STATUS.NOT_FOUND, APP_MESSAGES.ROUTE_NOT_FOUND);
}
