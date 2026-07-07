'use strict';
const galleryService = require('../services/gallery.service');
const asyncHandler = require('../core/asyncHandler');
const ApiResponse = require('../core/ApiResponse');
const pagination = require('../helpers/pagination.helper');
const ApiError = require('../core/ApiError');

exports.upload = asyncHandler(async (req, res) => {
  if (!req.files || !req.files.length) throw ApiError.badRequest('Tidak ada file diunggah');
  const created = await galleryService.uploadToActivity(req.params.activityId, req.files, req.user);
  return ApiResponse.created(res, created, `${created.length} media diunggah`);
});

exports.list = asyncHandler(async (req, res) => {
  const { page, limit } = pagination.parse(req.query, { defaultLimit: 12 });
  return ApiResponse.ok(res, await galleryService.list({ activity: req.query.activity, page, limit }));
});

exports.remove = asyncHandler(async (req, res) => {
  await galleryService.remove(req.params.id);
  return ApiResponse.ok(res, null, 'Media dihapus');
});
