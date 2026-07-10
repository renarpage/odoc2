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

// Friendly messages for multer upload errors (otherwise they'd surface as 500).
const MULTER_MESSAGES = {
  LIMIT_FILE_SIZE: "One or more files exceed the maximum allowed size (50MB each).",
  LIMIT_FILE_COUNT: "Too many files in one upload. Please upload fewer files at a time.",
  LIMIT_UNEXPECTED_FILE: "Unexpected file field in the upload.",
  LIMIT_PART_COUNT: "Too many form parts in one request.",
};

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  const isApiError = err instanceof ApiError;
  const isMulter = err && err.name === "MulterError";
  let code = isApiError ? err.statusCode : (err.status || 500);
  let message = err.message || "Something went wrong";

  // Multer errors are client input problems -> 400 with a friendly message.
  if (isMulter) {
    code = 400;
    message = MULTER_MESSAGES[err.code] || "Upload failed. Please check your files and try again.";
  }

  if (code >= 500) {
    logger.error("Unhandled error", { message: err.message, stack: err.stack, path: req.originalUrl });
  } else {
    logger.warn("Handled error", { message: err.message, status: code, path: req.originalUrl });
  }

  if (code >= 500 && env.isProd) message = "Internal server error";

  if (wantsJson(req)) {
    return res.status(code).json({ success: false, message, details: isApiError ? err.details : undefined });
  }

  // For admin form posts (multipart), a full error page is jarring; bounce back
  // to the previous page with a flash message instead.
  if (isMulter && typeof req.flash === "function") {
    req.flash("error", message);
    const back = req.get("referer") || "/admin/activities";
    return res.redirect(back);
  }

  return res.status(code).render("error", {
    title: `Error ${code}`,
    layout: "layouts/guest",
    statusCode: code,
    message,
  });
}

module.exports = errorHandler;
