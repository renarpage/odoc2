const BaseRepository = require("./baseRepository");
const DocumentModel = require("../models/Document");

class DocumentRepository extends BaseRepository {
  constructor() {
    super(DocumentModel);
  }

  byActivity(activityId) {
    return this.model.find({ activity: activityId }).sort({ createdAt: 1 });
  }

  incrementDownloads(id) {
    return this.model.findByIdAndUpdate(id, { $inc: { downloads: 1 } }, { new: true });
  }

  totalBytes() {
    return this.model.aggregate([{ $group: { _id: null, bytes: { $sum: "$bytes" } } }]);
  }

  mostDownloaded(limit = 5) {
    return this.model.find().sort({ downloads: -1 }).limit(limit);
  }
}

module.exports = new DocumentRepository();
