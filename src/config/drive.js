'use strict';
const { google } = require('googleapis');
const env = require('./env');
const logger = require('./logger');

let driveClient = null;

// Lazily build an authenticated Drive v3 client from the service account.
function getDrive() {
  if (driveClient) return driveClient;
  if (!env.drive.clientEmail || !env.drive.privateKey) {
    logger.warn('[drive] Service account not configured - uploads disabled');
    return null;
  }
  const auth = new google.auth.JWT({
    email: env.drive.clientEmail,
    key: env.drive.privateKey,
    scopes: ['https://www.googleapis.com/auth/drive'],
  });
  driveClient = google.drive({ version: 'v3', auth });
  return driveClient;
}

module.exports = { getDrive };
