import { HTTP_STATUS } from '../../constants/http-status.js';
import { APP_MESSAGES } from '../../constants/app.js';
import { sendSuccess } from '../../shared/http/response.js';

export function healthController(req, res) {
  return sendSuccess(res, HTTP_STATUS.OK, {
    message: APP_MESSAGES.HEALTH_OK
  });
}
