'use strict';
const settingService = require('../services/setting.service');
const asyncHandler = require('../core/asyncHandler');
const ApiResponse = require('../core/ApiResponse');
const pick = require('../utils/pick');

const FIELDS = ['primaryColor', 'secondaryColor', 'lightBg', 'darkBg', 'tagline', 'heroTitle', 'heroImageUrl', 'logoUrl', 'footerText', 'socials', 'contact', 'announcement'];

exports.page = asyncHandler(async (req, res) => {
  const settings = await settingService.get();
  res.render('admin/branding', { title: 'Branding & Tema', layout: 'layouts/admin', settings });
});

exports.update = asyncHandler(async (req, res) => {
  const settings = await settingService.update(pick(req.body, FIELDS), req.user);
  return ApiResponse.ok(res, settings, 'Pengaturan disimpan');
});
