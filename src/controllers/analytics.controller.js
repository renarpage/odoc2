'use strict';
const analyticsService = require('../services/analytics.service');
const asyncHandler = require('../core/asyncHandler');
const ApiResponse = require('../core/ApiResponse');

exports.overview = asyncHandler(async (_req, res) => ApiResponse.ok(res, await analyticsService.overview()));
