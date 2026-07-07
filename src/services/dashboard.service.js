'use strict';
const activityRepo = require('../repositories/activity.repository');
const galleryRepo = require('../repositories/gallery.repository');
const documentRepo = require('../repositories/document.repository');
const visitorRepo = require('../repositories/visitor.repository');
const userRepo = require('../repositories/user.repository');
const notificationRepo = require('../repositories/notification.repository');
const logRepo = require('../repositories/log.repository');
const storageService = require('./storage.service');
const cache = require('../config/cache');

class DashboardService {
  async stats() {
    const cached = cache.get('dashboard:stats');
    if (cached) return cached;

    const [statusTotals, totalActivity, totalGallery, totalDocs, galleryBytes, docBytes, visitorToday, visitorMonth, visitorTotal, recentActivity, recentLogins, unread] = await Promise.all([
      activityRepo.statusTotals(),
      activityRepo.count({ archived: false }),
      galleryRepo.count(),
      documentRepo.count(),
      galleryRepo.totalBytes(),
      documentRepo.totalBytes(),
      visitorRepo.countToday(),
      visitorRepo.countThisMonth(),
      visitorRepo.countTotal(),
      activityRepo.recent(5),
      userRepo.recentLogins(5),
      notificationRepo.unreadCount('admin'),
    ]);

    const usedBytes = (galleryBytes[0]?.bytes || 0) + (docBytes[0]?.bytes || 0);
    const stats = {
      totalActivity,
      status: statusTotals,
      totalGallery,
      totalDocs,
      storage: await storageService.usage(usedBytes),
      visitors: { today: visitorToday, month: visitorMonth, total: visitorTotal },
      recentActivity,
      recentLogins,
      unreadNotifications: unread,
    };
    cache.set('dashboard:stats', stats, 60);
    return stats;
  }

  recentLogs(limit = 20) { return logRepo.recent(limit); }
}
module.exports = new DashboardService();
