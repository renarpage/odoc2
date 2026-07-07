/**
 * URL-safe slug generation. Uniqueness is enforced by the repository layer,
 * which appends a short suffix on collision.
 */
function slugify(input = "") {
  return String(input)
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "activity";
}

module.exports = { slugify };
