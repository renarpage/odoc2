/**
 * Operational error carrying an HTTP status code. Anything thrown that is an
 * instance of ApiError is considered safe to surface to the client.
 */
class ApiError extends Error {
  constructor(statusCode, message, details = null) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.isOperational = true;
    if (details) this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(msg = "Bad request", details) {
    return new ApiError(400, msg, details);
  }
  static unauthorized(msg = "Authentication required") {
    return new ApiError(401, msg);
  }
  static forbidden(msg = "You do not have permission to perform this action") {
    return new ApiError(403, msg);
  }
  static notFound(msg = "Resource not found") {
    return new ApiError(404, msg);
  }
  static conflict(msg = "Resource already exists") {
    return new ApiError(409, msg);
  }
  static tooMany(msg = "Too many requests") {
    return new ApiError(429, msg);
  }
  static internal(msg = "Something went wrong") {
    return new ApiError(500, msg);
  }
}

module.exports = ApiError;
