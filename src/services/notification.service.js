'use strict';
const notificationRepo = require('../repositories/notification.repository');
const { NOTIFICATION_TYPES, NOTIFICATION_SCOPE } = require('../constants/notificationTypes');

class NotificationService {
  push({ kind = NOTIFICATION_TYPES.INFO, scope = NOTIFICATION_SCOPE.ADMIN, title, message, meta, user }) {
    return notificationRepo.create({ kind, scope, title, message, meta, user });
  }
  success(title, message, opts = {}) { return this.push({ kind: NOTIFICATION_TYPES.SUCCESS, title, message, ...opts }); }
  error(title, message, opts = {}) { return this.push({ kind: NOTIFICATION_TYPES.ERROR, title, message, ...opts }); }
  warn(title, message, opts = {}) { return this.push({ kind: NOTIFICATION_TYPES.WARNING, title, message, ...opts }); }
  list(opts) { return notificationRepo.list(opts); }
  markRead(id) { return notificationRepo.markRead(id); }
  markAllRead(scope) { return notificationRepo.markAllRead(scope); }
  unreadCount(scope) { return notificationRepo.unreadCount(scope); }
}
module.exports = new NotificationService();
