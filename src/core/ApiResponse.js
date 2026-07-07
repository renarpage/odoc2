'use strict';
// Uniform JSON envelope for API endpoints.
class ApiResponse {
  static ok(res, data = null, message = 'OK', meta = undefined) {
    return res.status(200).json({ success: true, message, data, meta });
  }
  static created(res, data = null, message = 'Created') {
    return res.status(201).json({ success: true, message, data });
  }
  static noContent(res) {
    return res.status(204).end();
  }
}
module.exports = ApiResponse;
