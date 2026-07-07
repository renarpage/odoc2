'use strict';
const Visitor = require('../models/Visitor');

function today() { return new Date().toISOString().slice(0, 10); }

class VisitorRepository {
  track({ ipHash, path, userAgent }) {
    return Visitor.updateOne(
      { day: today(), ipHash },
      { $inc: { count: 1 }, $setOnInsert: { path, userAgent } },
      { upsert: true },
    );
  }
  countToday() { return Visitor.countDocuments({ day: today() }); }
  countThisMonth() { return Visitor.countDocuments({ day: { $regex: `^${today().slice(0, 7)}` } }); }
  countTotal() { return Visitor.estimatedDocumentCount(); }
  async series(days = 14) {
    const rows = await Visitor.aggregate([
      { $group: { _id: '$day', visitors: { $sum: 1 } } },
      { $sort: { _id: -1 } },
      { $limit: days },
    ]);
    return rows.reverse();
  }
}
module.exports = new VisitorRepository();
