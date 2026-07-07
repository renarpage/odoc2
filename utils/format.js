/** Human-readable byte formatting for view parity ("2.4 MB"). */
function formatBytes(bytes = 0, decimals = 1) {
  if (!bytes || bytes <= 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), sizes.length - 1);
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`;
}

function bytesToGB(bytes = 0, decimals = 1) {
  return parseFloat((bytes / 1024 ** 3).toFixed(decimals));
}

module.exports = { formatBytes, bytesToGB };
