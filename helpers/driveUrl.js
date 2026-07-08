/**
 * Google Drive URL helpers.
 *
 * Drive's `uc?export=view` endpoint no longer renders reliably inside <img>
 * tags (it 302-redirects to a scan/consent page). The lh3 content host does,
 * so we normalize any stored Drive reference into a display URL there.
 */
function extractDriveId(u) {
  if (!u) return null;
  const s = String(u);
  let m;
  if ((m = s.match(/[?&]id=([A-Za-z0-9_-]+)/))) return m[1];
  if ((m = s.match(/\/file\/d\/([A-Za-z0-9_-]+)/))) return m[1];
  if ((m = s.match(/googleusercontent\.com\/d\/([A-Za-z0-9_-]+)/))) return m[1];
  if ((m = s.match(/\/d\/([A-Za-z0-9_-]+)/))) return m[1];
  if (/^[A-Za-z0-9_-]{25,}$/.test(s)) return s; // bare file id
  return null;
}

// Display URL for an <img>. Non-Drive URLs (e.g. Unsplash seeds) pass through.
function toDriveImage(u, size) {
  const id = extractDriveId(u);
  return id ? `https://lh3.googleusercontent.com/d/${id}=w${size || 1600}` : u;
}

// Direct-download URL for a Drive file.
function toDriveDownload(u) {
  const id = extractDriveId(u);
  return id ? `https://drive.google.com/uc?export=download&id=${id}` : u;
}

module.exports = { extractDriveId, toDriveImage, toDriveDownload };
