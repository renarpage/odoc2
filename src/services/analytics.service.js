'use strict';
const visitorRepo = require('../repositories/visitor.repository');
const activityRepo = require('../repositories/activity.repository');
const galleryRepo = require('../repositories/gallery.repository');
const documentRepo = require('../repositories/document.repository');

class AnalyticsService {
  async overview() {
    const [series, mostViewed, mostDownloadedDocs, mostDownloadedImages] = await Promise.all([
      visitorRepo.series(14),
      activityRepo.mostViewed(5),
      documentRepo.mostDownloaded(5),
      galleryRepo.mostDownloaded(5),
    ]);
    return { visitorSeries: series, mostViewed, mostDownloadedDocs, mostDownloadedImages };
  }
}
module.exports = new AnalyticsService();
