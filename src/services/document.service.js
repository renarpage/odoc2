'use strict';
const documentRepo = require('../repositories/document.repository');
const activityRepo = require('../repositories/activity.repository');
const storageService = require('./storage.service');
const ApiError = require('../core/ApiError');

const EXT = { 'application/pdf': 'pdf', 'application/msword': 'doc', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx', 'application/vnd.ms-excel': 'xls', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx', 'application/vnd.ms-powerpoint': 'ppt', 'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx', 'application/zip': 'zip' };

class DocumentService {
  async uploadToActivity(activityId, files, user) {
    const activity = await activityRepo.findById(activityId);
    if (!activity) throw ApiError.notFound('Activity tidak ditemukan');
    const created = [];
    for (const file of files) {
      const uploaded = await storageService.upload(file, { folderId: activity.driveFolderId });
      const doc = await documentRepo.create({ activity: activityId, uploadedBy: user.sub, ext: EXT[file.mimetype] || 'file', ...uploaded });
      created.push(doc);
    }
    return created;
  }
  byActivity(activityId) { return documentRepo.byActivity(activityId); }
  async remove(id) {
    const doc = await documentRepo.findById(id);
    if (!doc) throw ApiError.notFound('Dokumen tidak ditemukan');
    await storageService.remove(doc.fileId);
    await documentRepo.deleteById(id);
  }
  incrementDownload(id) { return documentRepo.updateById(id, { $inc: { downloads: 1 } }); }
}
module.exports = new DocumentService();
