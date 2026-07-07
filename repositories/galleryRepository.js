const BaseRepository = require("./baseRepository");
const Gallery = require("../models/Gallery");

class GalleryRepository extends BaseRepository {
  constructor() {
    super(Gallery);
  }

  byActivity(activityId) {
    return this.model.find({ activity: activityId }).sort({ order: 1, createdAt: 1 });
  }

  totalBytes() {
    return this.model.aggregate([{ $group: { _id: null, bytes: { $sum: "$bytes" } } }]);
  }
}

module.exports = new GalleryRepository();
