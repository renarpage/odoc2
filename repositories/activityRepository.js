const Activity = require("../models/Activity");

function buildQuery(filters = {}) {
  const q = {};
  if (filters.status) q.status = filters.status;
  if (filters.category) q.category = filters.category;
  if (filters.visibility) q.visibility = filters.visibility;
  if (typeof filters.archived === "boolean") q.archived = filters.archived;
  if (filters.year) {
    // match createdAt within the given calendar year
    const start = new Date(`${filters.year}-01-01T00:00:00.000Z`);
    const end = new Date(`${Number(filters.year) + 1}-01-01T00:00:00.000Z`);
    q.createdAt = { $gte: start, $lt: end };
  }
  if (filters.tag) q.tags = filters.tag;
  if (filters.search) q.$text = { $search: filters.search };
  return q;
}

module.exports = {
  buildQuery,
  create: (data) => Activity.create(data),
  findBySlug: (slug) => Activity.findOne({ slug }),
  findById: (id) => Activity.findById(id),
  slugExists: async (slug) => !!(await Activity.exists({ slug })),
  list: (filters = {}, { skip = 0, limit = 12, sort = { pinned: -1, createdAt: -1 } } = {}) =>
    Activity.find(buildQuery(filters)).sort(sort).skip(skip).limit(limit),
  count: (filters = {}) => Activity.countDocuments(buildQuery(filters)),
  countByStatus: (status) => Activity.countDocuments({ status }),
  updateBySlug: (slug, update) => Activity.findOneAndUpdate({ slug }, update, { new: true }),
  updateById: (id, update) => Activity.findByIdAndUpdate(id, update, { new: true }),
  deleteBySlug: (slug) => Activity.findOneAndDelete({ slug }),
  incrementViews: (slug) => Activity.findOneAndUpdate({ slug }, { $inc: { views: 1 } }, { new: true }),
  mostViewed: (limit = 5) => Activity.find({}).sort({ views: -1 }).limit(limit),
};
