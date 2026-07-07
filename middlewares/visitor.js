/**
 * Lightweight, privacy-conscious visitor tracking for analytics.
 * IPs are hashed; a session cookie dedupes repeat hits.
 */
const crypto = require("crypto");
const { v4: uuid } = require("uuid");
const visitorRepository = require("../repositories/visitorRepository");
const logger = require("../config/logger");

function trackVisit(req, res, next) {
  // Fire-and-forget; never block or fail the page render.
  try {
    let sessionId = req.cookies.odoc_vid;
    if (!sessionId) {
      sessionId = uuid();
      res.cookie("odoc_vid", sessionId, { httpOnly: true, sameSite: "lax", maxAge: 365 * 24 * 60 * 60 * 1000 });
    }
    const ipHash = crypto.createHash("sha256").update(req.ip || "").digest("hex").slice(0, 32);
    visitorRepository
      .create({ ipHash, sessionId, path: req.path, userAgent: (req.get("user-agent") || "").slice(0, 200) })
      .catch((err) => logger.warn("Visitor tracking failed", { error: err.message }));
  } catch (err) {
    logger.warn("Visitor tracking error", { error: err.message });
  }
  next();
}

module.exports = trackVisit;
