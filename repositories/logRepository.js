const Log = require("../models/Log");

module.exports = {
  create: (data) => Log.create(data),
  recent: (limit = 10) => Log.find({}).sort({ createdAt: -1 }).limit(limit),
  recentByAction: (action, limit = 10) =>
    Log.find({ action }).sort({ createdAt: -1 }).limit(limit),
  list: ({ skip = 0, limit = 50 } = {}) =>
    Log.find({}).sort({ createdAt: -1 }).skip(skip).limit(limit),
  count: () => Log.countDocuments({}),
};
