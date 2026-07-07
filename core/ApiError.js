/**
 * Operational error carrying an HTTP status. Anything thrown that is NOT an
 * ApiError is treated as an unexpected (500) error by the error handler.
 */
class ApiError extends Error {
  constructor(statusCode, message, details = null) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(msg = "Bad request", details) { return new ApiError(400, msg, details); }
  static unauthorized(msg = "Unauthorized") { return new ApiError(401, msg); }
  static forbidden(msg = "Forbidden") { return new ApiError(403, msg); }
  static notFound(msg = "Not found") { return new ApiError(404, msg); }
  static conflict(msg = "Conflict") { return new ApiError(409, msg); }
  static tooMany(msg = "Too many requests") { return new ApiError(429, msg); }
  static internal(msg = "Internal server error") { return new ApiError(500, msg); }
}

module.exports = ApiError;
