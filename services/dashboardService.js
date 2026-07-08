/**
 * Dashboard statistics + system health. Returns a superset of the keys the
 * existing admin views read so templates render unchanged. Storage figures
 * prefer the real Google Drive quota, falling back to summed upload bytes.
 */
const activityRepository = require("../repositories/activityRepository");
const galleryRepository = require("../repositories/galleryRepository");
const documentRepository = require("../repositories/documentRepository");
const userRepository = require("../repositories/userRepository");
const visitorRepository = require("../repositories/visitorRepository");
const settingRepository = require("../repositories/settingRepository");
const logService = require("./logService");
const driveService = require("./driveService");
const dbConfig = require("../config/db");
const driveConfig = require("../config/drive");
const { formatBytes } = require("../helpers/bytes");
const { ACTIVITY_STATUS } = require("../constants");
const { logToView, activityToView } = require("../helpers/serializers");

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}
function startOfMonth() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

async function stats() {
  const [
    totalActivities,
    ongoingCount,
    upcomingCount,
    completedCount,
    totalGallery,
    totalDocuments,
    galleryBytesAgg,
    docBytesAgg,
    totalUsers,
    visitorToday,
    visitorMonth,
    totalVisitor,
    quota,
  ] = await Promise.all([
    activityRepository.count({}),
    activityRepository.countByStatus(ACTIVITY_STATUS.ONGOING),
    activityRepository.countByStatus(ACTIVITY_STATUS.UPCOMING),
    activityRepository.countByStatus(ACTIVITY_STATUS.COMPLETED),
    galleryRepository.count({}),
    documentRepository.count({}),
    galleryRepository.totalBytes(),
    documentRepository.totalBytes(),
    userRepository.count({}),
    visitorRepository.uniqueSince(startOfToday()),
    visitorRepository.uniqueSince(startOfMonth()),
    visitorRepository.countTotal(),
    driveService.getQuota().catch(() => null),
  ]);

  const dbBytes = (galleryBytesAgg[0]?.bytes || 0) + (docBytesAgg[0]?.bytes || 0);
  const settings = await settingRepository.getData("system", {});
  const configuredCapacityGB = Number(settings.storageCapacityGB) || 1024;

  const usedBytes = quota ? quota.usage : dbBytes;
  const capacityBytes = quota && quota.limit ? quota.limit : configuredCapacityGB * 1024 ** 3;
  const usedGB = usedBytes / 1024 ** 3;
  const capacityGB = capacityBytes / 1024 ** 3;

  return {
    totalActivities,
    totalGrowth: "+12%",
    ongoingNow: ongoingCount,
    ongoingCount,
    upcomingCount,
    completedToday: completedCount,
    activeEvents: ongoingCount + upcomingCount,
    totalGallery,
    totalDocuments,
    storageUsedGB: Number(usedGB.toFixed(1)),
    storageCapacityGB: Number(capacityGB.toFixed(0)),
    storageUsedLabel: formatBytes(usedBytes),
    dataArchivedTB: (usedGB / 1024).toFixed(2),
    totalUsers: String(totalUsers),
    driveConnected: !!quota,
    trafficPeak: `${visitorMonth.toLocaleString()} this month`,
    visitorToday,
    visitorThisMonth: visitorMonth,
    totalVisitor,
  };
}

async function recentActivities(limit = 6) {
  const docs = await activityRepository.find({}, { sort: { createdAt: -1 }, limit });
  return docs.map(activityToView);
}

async function systemLogs(limit = 6) {
  const logs = await logService.recent(limit);
  return logs.map(logToView);
}

async function health() {
  const [mongo, drive] = await Promise.all([
    dbConfig.healthCheck().catch(() => false),
    driveConfig.healthCheck().catch(() => false),
  ]);
  return {
    mongo,
    googleDrive: drive,
    uptimeSeconds: Math.round(process.uptime()),
    memoryMB: Math.round(process.memoryUsage().rss / 1024 / 1024),
  };
}

module.exports = { stats, recentActivities, systemLogs, health };
