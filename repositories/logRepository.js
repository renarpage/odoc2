const BaseRepository = require("./baseRepository");
const Log = require("../models/Log");

class LogRepository extends BaseRepository {
  constructor() {
    super(Log);
  }

  recent(limit = 10) {
    return this.model.find().sort({ createdAt: -1 }).limit(limit);
  }
}

module.exports = new LogRepository();
