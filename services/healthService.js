/**
 * Dashboard health check: MongoDB status, Google Drive status, storage
 * capacity, and server uptime.
 */
const { isConnected } = require("../config/db");
const { pingDrive } = require("../config/googleDrive");
const { env } = require("../config/env");

async function check() {
  const drive = await pingDrive();
  return {
    mongo: { ok: isConnected(), state: isConnected() ? "connected" : "disconnected" },
    drive: {
      ok: drive.ok,
      reason: drive.reason || null,
      quota: drive.quota || null,
    },
    storageCapacityGB: env.storageCapacityGB,
    uptimeSeconds: Math.floor(process.uptime()),
    nodeEnv: env.nodeEnv,
    timestamp: new Date().toISOString(),
  };
}

module.exports = { check };
