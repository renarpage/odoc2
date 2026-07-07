const Visitor = require("../models/Visitor");

function today() {
  return new Date().toISOString().slice(0, 10);
}

function monthPrefix() {
  return new Date().toISOString().slice(0, 7); // YYYY-MM
}

module.exports = {
  today,
  /** Upsert a hit for a visitor on a given day. */
  track: (visitorHash, path) =>
    Visitor.findOneAndUpdate(
      { day: today(), visitorHash },
      { $inc: { hits: 1 }, $setOnInsert: { path } },
      { upsert: true, new: true }
    ),
  uniqueToday: () => Visitor.distinct("visitorHash", { day: today() }).then((a) => a.length),
  uniqueThisMonth: () =>
    Visitor.distinct("visitorHash", { day: { $regex: `^${monthPrefix()}` } }).then((a) => a.length),
  uniqueAllTime: () => Visitor.distinct("visitorHash").then((a) => a.length),
  totalHits: async () => {
    const [row] = await Visitor.aggregate([{ $group: { _id: null, hits: { $sum: "$hits" } } }]);
    return row ? row.hits : 0;
  },
};
