const BaseRepository = require("./baseRepository");
const Visitor = require("../models/Visitor");

class VisitorRepository extends BaseRepository {
  constructor() {
    super(Visitor);
  }

  countSince(date) {
    return this.model.countDocuments({ createdAt: { $gte: date } });
  }

  countTotal() {
    return this.model.estimatedDocumentCount();
  }

  // Distinct visitor sessions since a given date (dedupes repeat hits).
  async uniqueSince(date) {
    const ids = await this.model.distinct("sessionId", { createdAt: { $gte: date } });
    return ids.length;
  }
}

module.exports = new VisitorRepository();
