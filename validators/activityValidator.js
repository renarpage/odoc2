const ApiError = require("../core/ApiError");
const { ACTIVITY_STATUS, VISIBILITY } = require("../constants");

function validateCreate(body) {
  const title = String(body.title || "").trim();
  if (!title) throw ApiError.badRequest("Activity title is required");
  const out = {
    title,
    category: String(body.category || "Archive Gallery").trim(),
    date: body.date || undefined,
    location: body.location ? String(body.location).trim() : undefined,
    description: body.description ? String(body.description) : undefined,
    organizer: body.organizer,
    division: body.division,
    tags: body.tags,
  };
  if (body.status && !Object.values(ACTIVITY_STATUS).includes(body.status)) {
    throw ApiError.badRequest("Invalid status");
  }
  if (body.status) out.status = body.status;
  if (body.visibility && !Object.values(VISIBILITY).includes(body.visibility)) {
    throw ApiError.badRequest("Invalid visibility");
  }
  if (body.visibility) out.visibility = body.visibility;
  if (body.featured !== undefined) out.featured = body.featured;
  if (body.pinned !== undefined) out.pinned = body.pinned;
  return out;
}

function validateUpdate(body) {
  // All fields optional on update; only sanitize what's present.
  const out = { ...body };
  if (out.title !== undefined && !String(out.title).trim()) {
    throw ApiError.badRequest("Title cannot be empty");
  }
  return out;
}

module.exports = { validateCreate, validateUpdate };
