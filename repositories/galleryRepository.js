const Gallery = require("../models/Gallery");

module.exports = {
  create: (data) => Gallery.create(data),
  insertMany: (docs) => Gallery.insertMany(docs),
  listByActivity: (activityId) => Gallery.find({ activity: activityId }).sort({ createdAt: -1 }),
  list: ({ skip = 0, limit = 24 } = {}) =>
    Gallery.find({}).sort({ createdAt: -1 }).skip(skip).limit(limit),
  count: () => Gallery.countDocuments({}),
  totalBytes: async () => {
    const [row] = await Gallery.aggregate([
      { $group: { _id: null, bytes: { $sum: "$sizeBytes" } } },
    ]);
    return row ? row.bytes : 0;
  },
  findById: (id) => Gallery.findById(id),
  deleteById: (id) => Gallery.findByIdAndDelete(id),
};
