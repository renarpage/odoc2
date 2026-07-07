'use strict';
const winston = require('winston');
require('winston-daily-rotate-file');
const env = require('./env');

const transport = new winston.transports.DailyRotateFile({
  dirname: 'src/logs',
  filename: 'odoc-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  maxFiles: '14d',
});

const logger = winston.createLogger({
  level: env.isProd ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json(),
  ),
  transports: [transport],
});

if (!env.isProd) {
  logger.add(new winston.transports.Console({ format: winston.format.simple() }));
}

module.exports = logger;
