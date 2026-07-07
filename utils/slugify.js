/**
 * URL-safe slug generator for clean activity URLs (/activity/pentas-seni-2026).
 */
function slugify(input = "") {
  return String(input)
    .toLowerCase()
    .trim()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Ensure uniqueness against an async existence check. */
async function uniqueSlug(base, exists) {
  const root = slugify(base) || "activity";
  let candidate = root;
  let i = 2;
  // eslint-disable-next-line no-await-in-loop
  while (await exists(candidate)) {
    candidate = `${root}-${i}`;
    i += 1;
  }
  return candidate;
}

module.exports = { slugify, uniqueSlug };
