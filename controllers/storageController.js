const asyncHandler = require("../core/asyncHandler");
const dashboardService = require("../services/dashboardService");
const galleryRepository = require("../repositories/galleryRepository");
const documentRepository = require("../repositories/documentRepository");
const { formatBytes } = require("../helpers/bytes");

function relDate(d) {
  const now = new Date();
  const day = 24 * 60 * 60 * 1000;
  const diff = now - new Date(d);
  if (diff < day && now.getDate() === new Date(d).getDate()) {
    return `Today, ${new Date(d).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}`;
  }
  if (diff < 2 * day) return "Yesterday";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
}

const page = asyncHandler(async (req, res) => {
  const [stats, images, docs] = await Promise.all([
    dashboardService.stats(),
    galleryRepository.find({}, { sort: { createdAt: -1 }, limit: 5 }),
    documentRepository.find({}, { sort: { createdAt: -1 }, limit: 5 }),
  ]);
  const recentUploads = [
    ...images.map((g) => ({ name: g.originalName || "image", type: "Image", size: formatBytes(g.bytes), date: relDate(g.createdAt) })),
    ...docs.map((d) => ({ name: d.name, type: "Document", size: d.size || formatBytes(d.bytes), date: relDate(d.createdAt) })),
  ].slice(0, 6);
  res.render("admin/storage", { title: "Storage", stats, recentUploads });
});

module.exports = { page };
