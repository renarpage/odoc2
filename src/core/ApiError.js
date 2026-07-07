'use strict';
// Operational error carrying an HTTP status. Non-operational bugs bubble up as 500.
class ApiError extends Error {
  constructor(message, statusCode = 400, kind = 'error') {
    super(message);
    this.statusCode = statusCode;
    this.kind = kind; // maps to a notification type
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
  static badRequest(m = 'Bad request') { return new ApiError(m, 400); }
  static unauthorized(m = 'Not authenticated') { return new ApiError(m, 401); }
  static forbidden(m = 'Not allowed') { return new ApiError(m, 403); }
  static notFound(m = 'Resource not found') { return new ApiError(m, 404); }
  static conflict(m = 'Conflict') { return new ApiError(m, 409); }
  static tooLarge(m = 'Payload too large') { return new ApiError(m, 413); }
}
module.exports = ApiError;
