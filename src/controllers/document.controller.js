'use strict';
const documentService = require('../services/document.service');
const documentRepo = require('../repositories/document.repository');
const storageService = require('../services/storage.service');
const asyncHandler = require('../core/asyncHandler');
const ApiResponse = require('../core/ApiResponse');
const ApiError = require('../core/ApiError');

exports.upload = asyncHandler(async (req, res) => {
  if (!req.files || !req.files.length) throw ApiError.badRequest('Tidak ada dokumen diunggah');
  const created = await documentService.uploadToActivity(req.params.activityId, req.files, req.user);
  return ApiResponse.created(res, created, `${created.length} dokumen diunggah`);
});

exports.remove = asyncHandler(async (req, res) => {
  await documentService.remove(req.params.id);
  return ApiResponse.ok(res, null, 'Dokumen dihapus');
});

// Streamed download proxy - hides Drive IDs and enforces the downloadable flag.
exports.download = asyncHandler(async (req, res) => {
  const doc = await documentRepo.findById(req.params.id);
  if (!doc || !doc.downloadable) throw ApiError.notFound('Dokumen tidak tersedia');
  await documentService.incrementDownload(doc._id);
  res.setHeader('Content-Type', doc.mime || 'application/octet-stream');
  res.setHeader('Content-Disposition', `attachment; filename="${doc.name}"`);
  const driveRes = await storageService.stream(doc.fileId);
  driveRes.data.pipe(res);
});
