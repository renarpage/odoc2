'use strict';
const ApiError = require('./ApiError');

// Generic Mongoose repository. Concrete repos extend this and add domain queries.
class BaseRepository {
  constructor(model) {
    this.model = model;
  }
  create(doc) { return this.model.create(doc); }
  findById(id) { return this.model.findById(id); }
  findOne(filter) { return this.model.findOne(filter); }
  find(filter = {}, opts = {}) {
    let q = this.model.find(filter);
    if (opts.sort) q = q.sort(opts.sort);
    if (opts.skip) q = q.skip(opts.skip);
    if (opts.limit) q = q.limit(opts.limit);
    if (opts.lean) q = q.lean();
    return q;
  }
  count(filter = {}) { return this.model.countDocuments(filter); }
  async updateById(id, patch) {
    const doc = await this.model.findByIdAndUpdate(id, patch, { new: true, runValidators: true });
    if (!doc) throw ApiError.notFound(`${this.model.modelName} not found`);
    return doc;
  }
  async deleteById(id) {
    const doc = await this.model.findByIdAndDelete(id);
    if (!doc) throw ApiError.notFound(`${this.model.modelName} not found`);
    return doc;
  }
}
module.exports = BaseRepository;
