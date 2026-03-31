import { HTTP_STATUS } from '../constants/http-status.js';
import { ApiError } from '../shared/errors/api-error.js';

export function validateRequest(schema) {
  return function requestValidator(req, res, next) {
    const result = schema.safeParse({
      body: req.body,
      params: req.params,
      query: req.query
    });

    if (!result.success) {
      return next(
        new ApiError(HTTP_STATUS.UNPROCESSABLE_ENTITY, 'Validation failed', result.error.flatten())
      );
    }

    req.validated = result.data;
    return next();
  };
}
