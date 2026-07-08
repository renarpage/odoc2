/**
 * Storage analytics for the admin Storage page. Uses the real Google Drive
 * quota when available, otherwise falls back to a configured capacity against
 * summed upload bytes. All numbers are real; no placeholder values.
 */
const galleryRepository = require("../repositories/galleryRepository");
const documentRepository = require("../repositories/documentRepository");
const settingRepository = require("../repositories/settingRepository");
const Backup = require("../models/Backup");
const driveService = require("./driveService");
const { formatBytes } = require("../helpers/bytes");
const { resolveCapacityBytes } = require("../helpers/capacity");

const DONUT_CIRCUMFERENCE = 376.8; // 2 * PI * r(60)

async function typeAgg(model, match) {
  const pipeline = [];
  if (match) pipeline.push({ $match: match });
  pipeline.push({ $group: { _id: null, bytes: { $sum: "$bytes" }, files: { $sum: 1 } } });
  const r = await model.aggregate(pipeline);
  return r[0] || { bytes: 0, files: 0 };
}

function relDate(d) {
  const now = new Date();
  const then = new Date(d);
  const day = 24 * 60 * 60 * 1000;
  if (now.toDateString() === then.toDateString()) {
    return `Today, ${then.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}`;
  }
  if (now - then < 2 * day) return "Yesterday";
  return then.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
}

async function recentUploads() {
  const [images, docs] = await Promise.all([
    galleryRepository.find({}, { sort: { createdAt: -1 }, limit: 5 }),
    documentRepository.find({}, { sort: { createdAt: -1 }, limit: 5 }),
  ]);
  const rows = [
    ...images.map((g) => ({
      name: g.originalName || "image",
      type: String(g.mime).startsWith("video/") ? "Video" : "Image",
      size: formatBytes(g.bytes),
      date: relDate(g.createdAt),
    })),
    ...docs.map((d) => ({ name: d.name, type: "Document", size: d.size || formatBytes(d.bytes), date: relDate(d.createdAt) })),
  ];
  return rows.slice(0, 8);
}

async function overview() {
  const [images, videos, docs, backups, quota, settings] = await Promise.all([
    typeAgg(galleryRepository.model, { mime: { $regex: "^image/" } }),
    typeAgg(galleryRepository.model, { mime: { $regex: "^video/" } }),
    typeAgg(documentRepository.model, null),
    typeAgg(Backup, null),
    driveService.getQuota().catch(() => null),
    settingRepository.getData("system", {}),
  ]);

  const sumBytes = images.bytes + videos.bytes + docs.bytes + backups.bytes;
  const usedBytes = quota ? quota.usage : sumBytes;
  const capacityBytes = resolveCapacityBytes({ quota, settings });
  const pct = capacityBytes ? Math.min(100, (usedBytes / capacityBytes) * 100) : 0;

  const mk = (label, icon, agg) => ({
    label,
    icon,
    bytesLabel: formatBytes(agg.bytes),
    files: agg.files,
    percent: Number((capacityBytes ? (agg.bytes / capacityBytes) * 100 : 0).toFixed(1)),
  });

  return {
    driveConnected: !!quota,
    quotaHasLimit: !!(quota && quota.limit && quota.limit > 0),
    usedBytes,
    capacityBytes,
    usageLabel: formatBytes(usedBytes),
    capacityLabel: formatBytes(capacityBytes),
    availableLabel: formatBytes(Math.max(0, capacityBytes - usedBytes)),
    usedPercent: Number(pct.toFixed(1)),
    dashArray: (DONUT_CIRCUMFERENCE * (pct / 100)).toFixed(1),
    breakdown: [
      mk("Documents", "bi-file-earmark-text", docs),
      mk("Images", "bi-image", images),
      mk("Videos", "bi-camera-reels", videos),
      mk("Backups", "bi-hdd", backups),
    ],
    recentUploads: await recentUploads(),
  };
}

module.exports = { overview };
