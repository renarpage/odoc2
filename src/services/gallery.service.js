'use strict';
const sharp = require('sharp');
const galleryRepo = require('../repositories/gallery.repository');
const activityRepo = require('../repositories/activity.repository');
const storageService = require('./storage.service');
const ApiError = require('../core/ApiError');

class GalleryService {
  // Compress + convert images to WebP before uploading to Drive. Videos pass through.
  async optimize(file) {
    if (!file.mimetype.startsWith('image/')) return file;
    const buffer = await sharp(file.buffer).rotate().resize({ width: 1920, withoutEnlargement: true }).webp({ quality: 80 }).toBuffer();
    return { ...file, buffer, originalname: file.originalname.replace(/\.[^.]+$/, '.webp'), mimetype: 'image/webp', size: buffer.length };
  }

  async uploadToActivity(activityId, files, user) {
    const activity = await activityRepo.findById(activityId);
    if (!activity) throw ApiError.notFound('Activity tidak ditemukan');
    const created = [];
    for (const raw of files) {
      const file = await this.optimize(raw);
      const uploaded = await storageService.upload(file, { folderId: activity.driveFolderId });
      const kind = file.mimetype.startsWith('video/') ? 'video' : 'image';
      const doc = await galleryRepo.create({ activity: activityId, uploadedBy: user.sub, kind, ...uploaded });
      created.push(doc);
    }
    await activityRepo.updateById(activityId, { $push: { gallery: { $each: created.map((c) => ({ fileId: c.fileId, name: c.name, mime: c.mime, size: c.size, url: c.url, kind: c.kind })) } } });
    return created;
  }

  list(opts) { return galleryRepo.paginate(opts); }
  async remove(id) {
    const item = await galleryRepo.findById(id);
    if (!item) throw ApiError.notFound('Item galeri tidak ditemukan');
    await storageService.remove(item.fileId);
    await galleryRepo.deleteById(id);
  }
}
module.exports = new GalleryService();
