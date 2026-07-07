/**
 * Central audit/log writer. Wraps the log repository and never throws so that
 * a logging failure can never break a business operation.
 */
const logRepository = require("../repositories/logRepository");
const { LOG_TYPES } = require("../constants");
const logger = require("../utils/logger");

async function record({ type = LOG_TYPES.INFO, action, title, detail = "", actor = null, actorEmail, ip, meta }) {
  try {
    await logRepository.create({ type, action, title, detail, actor, actorEmail, ip, meta });
  } catch (err) {
    logger.error(`Audit log write failed for ${action}: ${err.message}`);
  }
}

module.exports = { record };
