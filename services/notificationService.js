const notificationRepository = require("../repositories/notificationRepository");
const { LOG_TYPES } = require("../constants");

module.exports = {
  push: ({ type = LOG_TYPES.INFO, title, detail = "", recipient = null }) =>
    notificationRepository.create({ type, title, detail, recipient }),
  listFor: (userId, limit) => notificationRepository.forUser(userId, limit),
  unreadCount: (userId) => notificationRepository.unreadCount(userId),
  markRead: (id) => notificationRepository.markRead(id),
  markAllRead: (userId) => notificationRepository.markAllRead(userId),
};
