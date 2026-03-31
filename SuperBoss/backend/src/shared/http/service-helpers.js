import { ApiError } from '../errors/api-error.js';
import { HTTP_STATUS } from '../../constants/http-status.js';

export function assertPolicy(decision) {
  if (!decision.allowed) {
    throw new ApiError(HTTP_STATUS.FORBIDDEN, decision.reason, decision.debug);
  }
}

export function requireDocument(document, message) {
  if (!document) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, message);
  }

  return document;
}
