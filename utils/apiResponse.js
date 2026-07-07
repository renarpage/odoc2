/**
 * Consistent JSON envelope for API responses.
 */
function success(res, { statusCode = 200, message = "OK", data = null, meta } = {}) {
  const payload = { success: true, message };
  if (data !== null && data !== undefined) payload.data = data;
  if (meta) payload.meta = meta;
  return res.status(statusCode).json(payload);
}

function failure(res, { statusCode = 400, message = "Error", details } = {}) {
  const payload = { success: false, message };
  if (details) payload.details = details;
  return res.status(statusCode).json(payload);
}

module.exports = { success, failure };
