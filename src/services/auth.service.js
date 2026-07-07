'use strict';
const userRepo = require('../repositories/user.repository');
const logRepo = require('../repositories/log.repository');
const tokenService = require('./token.service');
const ApiError = require('../core/ApiError');

class AuthService {
  async login(email, password, ctx = {}) {
    const user = await userRepo.findByEmail(email);
    if (!user || !user.active) throw ApiError.unauthorized('Email atau password salah');
    const ok = await user.comparePassword(password);
    if (!ok) throw ApiError.unauthorized('Email atau password salah');

    user.lastLoginAt = new Date();
    await user.save();
    await logRepo.create({ action: 'auth.login', actor: user._id, actorEmail: user.email, ipHash: ctx.ipHash });

    return {
      user: user.toSafeJSON(),
      accessToken: tokenService.signAccess(user),
      refreshToken: tokenService.signRefresh(user),
    };
  }

  async refresh(refreshToken) {
    if (!refreshToken) throw ApiError.unauthorized('Sesi berakhir, silakan login ulang');
    let payload;
    try { payload = tokenService.verifyRefresh(refreshToken); } catch { throw ApiError.unauthorized('Sesi tidak valid'); }
    const user = await userRepo.findById(payload.sub);
    if (!user || !user.active || user.tokenVersion !== payload.v) throw ApiError.unauthorized('Sesi tidak valid');
    return { accessToken: tokenService.signAccess(user), user: user.toSafeJSON() };
  }

  async logout(userId) {
    // Bump tokenVersion so any outstanding refresh token is rejected.
    await userRepo.updateById(userId, { $inc: { tokenVersion: 1 } });
  }
}
module.exports = new AuthService();
