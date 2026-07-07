'use strict';
const multer = require('multer');
const env = require('../config/env');
const ApiError = require('../core/ApiError');

const IMAGE = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const VIDEO = ['video/mp4', 'video/webm'];
const DOC = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation', 'application/zip'];

// Memory storage so buffers stream straight to Google Drive (no disk writes).
function build(allowed, maxSize) {
  return multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: maxSize },
    fileFilter: (_req, file, cb) => {
      if (!allowed.includes(file.mimetype)) return cb(ApiError.badRequest(`Tipe file tidak diizinkan: ${file.mimetype}`));
      cb(null, true);
    },
  });
}

module.exports = {
  uploadImages: build([...IMAGE, ...VIDEO], env.uploads.maxVideo).array('files', 20),
  uploadDocuments: build(DOC, env.uploads.maxDoc).array('files', 20),
};
