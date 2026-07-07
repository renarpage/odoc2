/**
 * JWT access tokens + opaque, rotated, hashed refresh tokens.
 */
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const env = require("../config/env");

function generateAccessToken(user) {
  return jwt.sign(
    { sub: String(user._id || user.id), role: user.role, name: user.name },
    env.JWT_ACCESS_SECRET,
    { expiresIn: env.JWT_ACCESS_TTL }
  );
}

function verifyAccessToken(token) {
  return jwt.verify(token, env.JWT_ACCESS_SECRET);
}

function generateRefreshValue() {
  // Opaque high-entropy token; only its hash is ever stored.
  return crypto.randomBytes(48).toString("hex");
}

function hashToken(raw) {
  return crypto.createHash("sha256").update(raw).digest("hex");
}

function refreshExpiryDate() {
  return new Date(Date.now() + env.REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000);
}

module.exports = {
  generateAccessToken,
  verifyAccessToken,
  generateRefreshValue,
  hashToken,
  refreshExpiryDate,
};
