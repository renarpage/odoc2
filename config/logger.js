/**
 * Application-wide structured logger (winston).
 * Console transport everywhere; file transports for warnings/errors.
 */
const path = require("path");
const fs = require("fs");
const winston = require("winston");
const env = require("./env");

const logDir = path.join(process.cwd(), "logs");
try {
  if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
} catch (_) {
  /* ignore fs errors in read-only environments */
}

const logger = winston.createLogger({
  level: env.isProd ? "info" : "debug",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: "odoc" },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ level, message, timestamp, stack }) =>
          `${timestamp} ${level}: ${stack || message}`
        )
      ),
    }),
    new winston.transports.File({ filename: path.join(logDir, "error.log"), level: "error" }),
    new winston.transports.File({ filename: path.join(logDir, "combined.log") }),
  ],
});

// Stream adapter so morgan can pipe HTTP logs through winston.
logger.stream = {
  write: (message) => logger.http ? logger.http(message.trim()) : logger.info(message.trim()),
};

module.exports = logger;
