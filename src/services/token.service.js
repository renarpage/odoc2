'use strict';
const jwt = require('jsonwebtoken');
const env = require('../config/env');

// Access + refresh token pair. Refresh carries tokenVersion for revocation.
function signAccess(user) {
  return jwt.sign({ sub: String(user._id), role: user.role, name: user.name }, env.jwt.accessSecret, {
    expiresIn: env.jwt.accessExpires,
  });
}

function signRefresh(user) {
  return jwt.sign({ sub: String(user._id), v: user.tokenVersion }, env.jwt.refreshSecret, {
    expiresIn: env.jwt.refreshExpires,
  });
}

function verifyAccess(token) { return jwt.verify(token, env.jwt.accessSecret); }
function verifyRefresh(token) { return jwt.verify(token, env.jwt.refreshSecret); }

module.exports = { signAccess, signRefresh, verifyAccess, verifyRefresh };
