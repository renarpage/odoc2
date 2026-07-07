'use strict';
const notificationService = require('../services/notification.service');
const asyncHandler = require('../core/asyncHandler');
const ApiResponse = require('../core/ApiResponse');
const pagination = require('../helpers/pagination.helper');

exports.list = asyncHandler(async (req, res) => {
  const { page, limit } = pagination.parse(req.query, { defaultLimit: 20 });
  const data = await notificationService.list({ scope: 'admin', page, limit });
  const unread = await notificationService.unreadCount('admin');
  return ApiResponse.ok(res, data, 'OK', { unread });
});

exports.markRead = asyncHandler(async (req, res) => {
  await notificationService.markRead(req.params.id);
  return ApiResponse.ok(res, null, 'Ditandai dibaca');
});

exports.markAllRead = asyncHandler(async (_req, res) => {
  await notificationService.markAllRead('admin');
  return ApiResponse.ok(res, null, 'Semua ditandai dibaca');
});
