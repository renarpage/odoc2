/**
 * Human-readable byte formatting, matching the existing UI style (e.g. "2.4 MB").
 */
function formatBytes(bytes) {
  const n = Number(bytes) || 0;
  if (n <= 0) return "0 KB";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.min(Math.floor(Math.log(n) / Math.log(1024)), units.length - 1);
  const value = n / Math.pow(1024, i);
  return `${value.toFixed(value >= 100 || i === 0 ? 0 : 1)} ${units[i]}`;
}

function extToType(nameOrMime = "") {
  const s = nameOrMime.toLowerCase();
  if (s.includes("pdf")) return "pdf";
  if (s.includes("word") || s.endsWith(".doc") || s.endsWith(".docx")) return "docx";
  if (s.includes("sheet") || s.includes("excel") || s.endsWith(".xls") || s.endsWith(".xlsx")) return "xlsx";
  if (s.includes("presentation") || s.includes("powerpoint") || s.endsWith(".ppt") || s.endsWith(".pptx")) return "pptx";
  if (s.includes("zip")) return "zip";
  return "file";
}

module.exports = { formatBytes, extToType };
