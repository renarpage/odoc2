const Document = require("../models/Document");

module.exports = {
  create: (data) => Document.create(data),
  insertMany: (docs) => Document.insertMany(docs),
  listByActivity: (activityId) => Document.find({ activity: activityId }).sort({ createdAt: -1 }),
  count: () => Document.countDocuments({}),
  totalBytes: async () => {
    const [row] = await Document.aggregate([
      { $group: { _id: null, bytes: { $sum: "$sizeBytes" } } },
    ]);
    return row ? row.bytes : 0;
  },
  findById: (id) => Document.findById(id),
  incrementDownloads: (id) => Document.findByIdAndUpdate(id, { $inc: { downloads: 1 } }, { new: true }),
  mostDownloaded: (limit = 5) => Document.find({}).sort({ downloads: -1 }).limit(limit),
  deleteById: (id) => Document.findByIdAndDelete(id),
};
