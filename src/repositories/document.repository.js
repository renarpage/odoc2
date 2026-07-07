'use strict';
const BaseRepository = require('../core/BaseRepository');
const Document = require('../models/Document');

class DocumentRepository extends BaseRepository {
  constructor() { super(Document); }
  byActivity(activity) { return this.model.find({ activity }).sort('-createdAt').lean(); }
  totalBytes() { return this.model.aggregate([{ $group: { _id: null, bytes: { $sum: '$size' } } }]); }
  mostDownloaded(limit = 5) { return this.model.find().sort('-downloads').limit(limit).lean(); }
}
module.exports = new DocumentRepository();
