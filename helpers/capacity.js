/**
 * Resolves the storage capacity (in bytes) shown across the admin UI.
 *
 * Priority (first match wins):
 *   1. Real Google Drive quota limit, when the account reports one (> 0).
 *      Service accounts and unlimited Workspace accounts usually DON'T, so:
 *   2. `storageCapacityGB` saved in system settings (Settings page / DB).
 *   3. `STORAGE_CAPACITY_GB` env var.
 *   4. Env default (15 GB), matching a standard free Google account.
 *
 * This is why capacity previously showed a flat 1 TB: a service account
 * returned no `limit`, and the old fallback was hardcoded to 1024 GB.
 */
const env = require("../config/env");

const GB = 1024 ** 3;

function resolveCapacityBytes({ quota, settings } = {}) {
  if (quota && quota.limit && quota.limit > 0) return quota.limit;
  const configuredGB = Number(settings && settings.storageCapacityGB);
  if (Number.isFinite(configuredGB) && configuredGB > 0) return configuredGB * GB;
  return env.STORAGE_CAPACITY_GB * GB;
}

module.exports = { resolveCapacityBytes, GB };
