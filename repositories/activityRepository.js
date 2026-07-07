const BaseRepository = require("./baseRepository");
const Activity = require("../models/Activity");
const { slugify } = require("../helpers/slug");

class ActivityRepository extends BaseRepository {
  constructor() {
    super(Activity);
  }

  findBySlug(slug) {
    return this.model.findOne({ slug });
  }

  async generateUniqueSlug(title) {
    const base = slugify(title);
    let slug = base;
    let n = 1;
    // eslint-disable-next-line no-await-in-loop
    while (await this.model.exists({ slug })) {
      n += 1;
      slug = `${base}-${n}`;
    }
    return slug;
  }

  incrementViews(id) {
    return this.model.findByIdAndUpdate(id, { $inc: { views: 1 } }, { new: true });
  }

  countByStatus(status) {
    return this.model.countDocuments({ status });
  }

  mostViewed(limit = 5) {
    return this.model.find({ visibility: "public" }).sort({ views: -1 }).limit(limit);
  }
}

module.exports = new ActivityRepository();
