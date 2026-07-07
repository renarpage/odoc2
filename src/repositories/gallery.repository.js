'use strict';
const BaseRepository = require('../core/BaseRepository');
const Gallery = require('../models/Gallery');

class GalleryRepository extends BaseRepository {
  constructor() { super(Gallery); }
  async paginate({ activity, page = 1, limit = 12 }) {
    const filter = {};
    if (activity) filter.activity = activity;
    const skip = (Number(page) - 1) * Number(limit);
    const [items, total] = await Promise.all([
      this.model.find(filter).sort('-createdAt').skip(skip).limit(Number(limit)).lean(),
      this.model.countDocuments(filter),
    ]);
    return { items, total, page: Number(page), pages: Math.ceil(total / Number(limit)) };
  }
  totalBytes() { return this.model.aggregate([{ $group: { _id: null, bytes: { $sum: '$size' } } }]); }
  mostDownloaded(limit = 5) { return this.model.find().sort('-downloads').limit(limit).lean(); }
}
module.exports = new GalleryRepository();
