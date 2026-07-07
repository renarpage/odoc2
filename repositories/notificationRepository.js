const Notification = require("../models/Notification");

module.exports = {
  create: (data) => Notification.create(data),
  forUser: (userId, limit = 20) =>
    Notification.find({ $or: [{ recipient: userId }, { recipient: null }] })
      .sort({ createdAt: -1 })
      .limit(limit),
  unreadCount: (userId) =>
    Notification.countDocuments({ $or: [{ recipient: userId }, { recipient: null }], read: false }),
  markRead: (id) => Notification.findByIdAndUpdate(id, { read: true }, { new: true }),
  markAllRead: (userId) =>
    Notification.updateMany(
      { $or: [{ recipient: userId }, { recipient: null }], read: false },
      { read: true }
    ),
};
