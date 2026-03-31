export function sendSuccess(res, statusCode, data) {
  return res.status(statusCode).json({
    success: true,
    data,
    error: null
  });
}

export function sendError(res, statusCode, message, details = null) {
  return res.status(statusCode).json({
    success: false,
    data: null,
    error: {
      message,
      details
    }
  });
}
