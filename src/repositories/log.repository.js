'use strict';
const BaseRepository = require('../core/BaseRepository');
const Log = require('../models/Log');

class LogRepository extends BaseRepository {
  constructor() { super(Log); }
  recent(limit = 20) { return this.model.find().sort('-createdAt').limit(limit).lean(); }
}
module.exports = new LogRepository();
