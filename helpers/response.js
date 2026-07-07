/**
 * Consistent JSON envelopes for the API surface.
 */
function ok(res, data = null, meta = undefined) {
  const body = { success: true, data };
  if (meta) body.meta = meta;
  return res.json(body);
}

function created(res, data = null) {
  return res.status(201).json({ success: true, data });
}

function fail(res, statusCode, message, details = undefined) {
  const body = { success: false, message };
  if (details) body.details = details;
  return res.status(statusCode).json(body);
}

module.exports = { ok, created, fail };
