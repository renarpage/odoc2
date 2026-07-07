/**
 * Central error handler. Logs everything, returns safe messages, and never
 * leaks stack traces or internals to clients.
 */
const logger = require("../config/logger");
const env = require("../config/env");
const ApiError = require("../core/ApiError");

function wantsJson(req) {
  return req.originalUrl.startsWith("/api") || req.xhr || (req.get("accept") || "").includes("application/json");
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  const isApiError = err instanceof ApiError;
  const statusCode = isApiError ? err.statusCode : (err.status || 500);

  if (statusCode >= 500) {
    logger.error("Unhandled error", { message: err.message, stack: err.stack, path: req.originalUrl });
  } else {
    logger.warn("Handled error", { message: err.message, status: statusCode, path: req.originalUrl });
  }

  // Multer file-size errors surface as a friendly 400.
  let message = err.message || "Something went wrong";
  let code = statusCode;
  if (err.code === "LIMIT_FILE_SIZE") {
    code = 400;
    message = "File exceeds the maximum allowed size";
  }
  if (code >= 500 && env.isProd) message = "Internal server error";

  if (wantsJson(req)) {
    return res.status(code).json({ success: false, message, details: isApiError ? err.details : undefined });
  }
  return res.status(code).render("error", {
    title: `Error ${code}`,
    layout: "layouts/guest",
    statusCode: code,
    message,
  });
}

module.exports = errorHandler;
