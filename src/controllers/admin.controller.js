'use strict';
const userRepo = require('../repositories/user.repository');
const dashboardService = require('../services/dashboard.service');
const asyncHandler = require('../core/asyncHandler');

exports.storagePage = asyncHandler(async (req, res) => {
  const stats = await dashboardService.stats();
  res.render('admin/storage', { title: 'Storage', layout: 'layouts/admin', stats });
});

exports.usersPage = asyncHandler(async (req, res) => {
  const users = await userRepo.listAdmins();
  res.render('admin/users', { title: 'Kelola Admin', layout: 'layouts/admin', users });
});

exports.settingsPage = asyncHandler(async (req, res) => {
  res.render('admin/settings', { title: 'Pengaturan', layout: 'layouts/admin' });
});
