/**
 * In-memory multipart handling. Files are held in RAM only long enough to
 * stream to Google Drive; nothing is written to the app server's disk.
 *
 * Validation is EXTENSION-first (browsers report inconsistent MIME types),
 * with MIME as a secondary allow. This is also mirrored client-side so
 * unsupported files are rejected the moment they are selected.
 */
const path = require("path");
const multer = require("multer");
const env = require("../config/env");
const ApiError = require("../core/ApiError");
const { ALLOWED_UPLOAD_EXT, ALLOWED_UPLOAD_MIME } = require("../constants");

const storage = multer.memoryStorage();

function extemOf(name) {
  return path.extname(String(name || "")).replace(/^\./, "").toLowerCase();
}

function fileFilter(req, file, cb) {
  const ext = extemOf(file.originalname);
  const okExt = ext && ALLOWED_UPLOAD_EXT.includes(ext);
  const okMime = ALLOWED_UPLOAD_MIME.includes(file.mimetype);
  if (okExt || okMime) return cb(null, true);
  return cb(ApiError.badRequest(`Unsupported file type: .${ext || file.mimetype}`));
}

// Max files accepted in a single create/edit submit. Admins upload large
// batches (whole event galleries), so keep this generous.
const MAX_FILES_PER_REQUEST = parseInt(env.MAX_FILES_PER_REQUEST || "200", 10);

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: env.MAX_UPLOAD_BYTES,
    files: MAX_FILES_PER_REQUEST,
  },
});

module.exports = upload;
module.exports.MAX_FILES_PER_REQUEST = MAX_FILES_PER_REQUEST;
