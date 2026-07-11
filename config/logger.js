//==============================================================//
//  CONFIG — Logger (winston)                                   //
//  Console everywhere. File transports only when the FS is      //
//  writable (skipped on serverless / read-only environments).  //
//==============================================================//
const path = require("path");
const fs = require("fs");
const winston = require("winston");
const env = require("./env");

const transports = [
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.printf(({ level, message, timestamp, stack }) => `${timestamp} ${level}: ${stack || message}`)
    ),
  }),
];

// Only attach file transports when we have a writable filesystem.
if (!env.SERVERLESS) {
  const logDir = path.join(process.cwd(), "logs");
  try {
    if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
    transports.push(new winston.transports.File({ filename: path.join(logDir, "error.log"), level: "error" }));
    transports.push(new winston.transports.File({ filename: path.join(logDir, "combined.log") }));
  } catch (_) {
    // Read-only FS: console-only logging.
  }
}

const logger = winston.createLogger({
  level: env.isProd ? "info" : "debug",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: "odoc" },
  transports,
});

// Stream adapter so morgan can pipe HTTP logs through winston.
logger.stream = {
  write: (message) => (logger.http ? logger.http(message.trim()) : logger.info(message.trim())),
};

module.exports = logger;
