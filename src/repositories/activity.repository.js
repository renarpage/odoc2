'use strict';
const BaseRepository = require('../core/BaseRepository');
const Activity = require('../models/Activity');
const { ACTIVITY_STATUS } = require('../constants/activityStatus');

class ActivityRepository extends BaseRepository {
  constructor() { super(Activity); }

  findBySlug(slug) { return this.model.findOne({ slug }); }

  // Paginated + filtered query used by both guest site and admin manager.
  async paginate({ page = 1, limit = 9, status, category, division, year, tag, search, publicOnly = false }) {
    const filter = { archived: false };
    if (publicOnly) { filter.isDraft = false; filter.visibility = 'public'; }
    if (status) filter.status = status;
    if (category) filter.category = category;
    if (division) filter.division = division;
    if (tag) filter.tags = tag;
    if (year) {
      const y = Number(year);
      filter.startDate = { $gte: new Date(y, 0, 1), $lte: new Date(y, 11, 31, 23, 59, 59) };
    }
    if (search) filter.$text = { $search: search };

    const skip = (Number(page) - 1) * Number(limit);
    const [items, total] = await Promise.all([
      this.model.find(filter).sort({ pinned: -1, startDate: -1 }).skip(skip).limit(Number(limit)).lean(),
      this.model.countDocuments(filter),
    ]);
    return { items, total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / Number(limit)) };
  }

  countByStatus() {
    return this.model.aggregate([
      { $match: { archived: false } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);
  }

  async statusTotals() {
    const rows = await this.countByStatus();
    const base = { [ACTIVITY_STATUS.UPCOMING]: 0, [ACTIVITY_STATUS.ONGOING]: 0, [ACTIVITY_STATUS.COMPLETED]: 0 };
    rows.forEach((r) => { base[r._id] = r.count; });
    return base;
  }

  mostViewed(limit = 5) { return this.model.find({ isDraft: false }).sort('-views').limit(limit).lean(); }
  recent(limit = 5) { return this.model.find().sort('-createdAt').limit(limit).lean(); }
  incrementViews(id) { return this.model.updateOne({ _id: id }, { $inc: { views: 1 } }); }

  async relatedTo(activity, limit = 3) {
    return this.model
      .find({ _id: { $ne: activity._id }, isDraft: false, $or: [{ category: activity.category }, { tags: { $in: activity.tags || [] } }] })
      .limit(limit)
      .lean();
  }
}
module.exports = new ActivityRepository();
