'use strict';
const mongoose = require('mongoose');
const { getDrive } = require('../config/drive');
const env = require('../config/env');

class HealthcheckService {
  async check() {
    const mongoUp = mongoose.connection.readyState === 1;
    let driveUp = false;
    try { driveUp = !!getDrive(); } catch { driveUp = false; }
    return {
      mongo: { status: mongoUp ? 'up' : 'down' },
      drive: { status: driveUp ? 'configured' : 'not_configured' },
      storage: { quotaBytes: env.drive.quotaBytes },
      uptimeSeconds: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
    };
  }
}
module.exports = new HealthcheckService();
