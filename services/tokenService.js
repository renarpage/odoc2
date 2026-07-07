/**
 * JWT issuing, verification and refresh-token rotation.
 * Access token: short-lived, sent as HTTP-only cookie + usable as Bearer.
 * Refresh token: long-lived, HTTP-only cookie, hashed at rest in the DB.
 */
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const { env } = require("../config/env");
const ApiError = require("../utils/ApiError");

function signAccess(user) {
  return jwt.sign(
    { sub: user._id.toString(), role: user.role, type: "access" },
    env.jwt.accessSecret,
    { expiresIn: env.jwt.accessExpires }
  );
}

function signRefresh(user) {
  const jti = crypto.randomBytes(16).toString("hex");
  const token = jwt.sign(
    { sub: user._id.toString(), type: "refresh", jti },
    env.jwt.refreshSecret,
    { expiresIn: env.jwt.refreshExpires }
  );
  return token;
}

function verifyAccess(token) {
  try {
    const payload = jwt.verify(token, env.jwt.accessSecret);
    if (payload.type !== "access") throw new Error("wrong token type");
    return payload;
  } catch (err) {
    throw ApiError.unauthorized("Session expired or invalid. Please log in again.");
  }
}

function verifyRefresh(token) {
  try {
    const payload = jwt.verify(token, env.jwt.refreshSecret);
    if (payload.type !== "refresh") throw new Error("wrong token type");
    return payload;
  } catch (err) {
    throw ApiError.unauthorized("Refresh token expired or invalid.");
  }
}

/** Hash a refresh token before storing/comparing (never store raw tokens). */
function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

module.exports = { signAccess, signRefresh, verifyAccess, verifyRefresh, hashToken };
