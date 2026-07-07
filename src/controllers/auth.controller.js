'use strict';
const crypto = require('crypto');
const authService = require('../services/auth.service');
const asyncHandler = require('../core/asyncHandler');
const { setAuthCookies, clearAuthCookies } = require('../helpers/cookie.helper');
const env = require('../config/env');

exports.loginPage = (req, res) => {
  if (req.user) return res.redirect('/admin');
  res.render('auth/login', { title: 'Login', layout: 'layouts/guest', error: null });
};

exports.login = asyncHandler(async (req, res) => {
  const { email, password, remember } = req.body;
  const ipHash = crypto.createHmac('sha256', env.cookieSecret).update(req.ip || 'x').digest('hex');
  const { accessToken, refreshToken } = await authService.login(email, password, { ipHash });
  setAuthCookies(res, { accessToken, refreshToken }, remember === 'on' || remember === true);
  if (req.accepts('json') && req.xhr) return res.json({ success: true, redirect: '/admin' });
  res.redirect('/admin');
});

exports.logout = asyncHandler(async (req, res) => {
  if (req.user) await authService.logout(req.user.sub);
  clearAuthCookies(res);
  res.redirect('/');
});
