/**
 * Thin, reusable data-access wrapper around a Mongoose model.
 * Keeps controllers/services free of raw query calls (Repository Pattern).
 */
class BaseRepository {
  constructor(model) {
    this.model = model;
  }

  create(data) {
    return this.model.create(data);
  }

  findById(id, projection = null) {
    return this.model.findById(id, projection);
  }

  findOne(filter = {}, projection = null) {
    return this.model.findOne(filter, projection);
  }

  find(filter = {}, { sort = { createdAt: -1 }, skip = 0, limit = 0, projection = null } = {}) {
    let q = this.model.find(filter, projection).sort(sort);
    if (skip) q = q.skip(skip);
    if (limit) q = q.limit(limit);
    return q;
  }

  count(filter = {}) {
    return this.model.countDocuments(filter);
  }

  updateById(id, update) {
    return this.model.findByIdAndUpdate(id, update, { new: true, runValidators: true });
  }

  deleteById(id) {
    return this.model.findByIdAndDelete(id);
  }
}

module.exports = BaseRepository;
