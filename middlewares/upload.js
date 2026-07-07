/**
 * In-memory multipart handling. Files are held in RAM only long enough to
 * stream to Google Drive; nothing is written to the app server's disk.
 */
const multer = require("multer");
const env = require("../config/env");
const ApiError = require("../core/ApiError");
const { ALLOWED_UPLOAD_MIME } = require("../constants");

const storage = multer.memoryStorage();

function fileFilter(req, file, cb) {
  if (ALLOWED_UPLOAD_MIME.includes(file.mimetype)) return cb(null, true);
  return cb(ApiError.badRequest(`Unsupported file type: ${file.mimetype}`));
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: env.MAX_UPLOAD_BYTES, files: 20 },
});

module.exports = upload;
