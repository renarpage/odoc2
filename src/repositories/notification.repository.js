'use strict';
const BaseRepository = require('../core/BaseRepository');
const Notification = require('../models/Notification');

class NotificationRepository extends BaseRepository {
  constructor() { super(Notification); }
  async list({ scope = 'admin', page = 1, limit = 20 }) {
    const skip = (Number(page) - 1) * Number(limit);
    const [items, total] = await Promise.all([
      this.model.find({ scope }).sort('-createdAt').skip(skip).limit(Number(limit)).lean(),
      this.model.countDocuments({ scope }),
    ]);
    return { items, total, page: Number(page), pages: Math.ceil(total / Number(limit)) };
  }
  markRead(id) { return this.model.updateOne({ _id: id }, { read: true }); }
  markAllRead(scope) { return this.model.updateMany({ scope, read: false }, { read: true }); }
  unreadCount(scope = 'admin') { return this.model.countDocuments({ scope, read: false }); }
}
module.exports = new NotificationRepository();
