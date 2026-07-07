/**
 * Audit + system logging. Never throws into the caller path: logging failures
 * must not break the operation being logged.
 */
const logRepository = require("../repositories/logRepository");
const logger = require("../config/logger");
const { LOG_TYPES, LOG_ACTIONS } = require("../constants");

async function record({ type = LOG_TYPES.INFO, action = LOG_ACTIONS.CREATE, title, detail = "", user = null, userEmail = null, ip = null, meta = {} }) {
  try {
    await logRepository.create({ type, action, title, detail, user, userEmail, ip, meta });
  } catch (err) {
    logger.error("Failed to write audit log", { error: err.message, title });
  }
}

function recent(limit = 10) {
  return logRepository.recent(limit);
}

module.exports = { record, recent, LOG_TYPES, LOG_ACTIONS };
