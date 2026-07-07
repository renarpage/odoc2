'use strict';
const { Readable } = require('stream');
const { getDrive } = require('../config/drive');
const env = require('../config/env');
const logger = require('../config/logger');
const ApiError = require('../core/ApiError');

// Google Drive storage adapter. Streams buffers up, creates a folder per activity,
// validates permissions, and exposes quota usage for the storage dashboard.
class StorageService {
  drive() {
    const d = getDrive();
    if (!d) throw ApiError.badRequest('Google Drive belum dikonfigurasi');
    return d;
  }

  async ensureActivityFolder(activityTitle, slug) {
    const drive = this.drive();
    const name = `activity-${slug}`;
    const q = `name='${name}' and mimeType='application/vnd.google-apps.folder' and '${env.drive.rootFolderId}' in parents and trashed=false`;
    const found = await drive.files.list({ q, fields: 'files(id)' });
    if (found.data.files && found.data.files.length) return found.data.files[0].id;
    const res = await drive.files.create({
      requestBody: { name, mimeType: 'application/vnd.google-apps.folder', parents: [env.drive.rootFolderId] },
      fields: 'id',
    });
    return res.data.id;
  }

  async upload(file, { folderId } = {}) {
    const drive = this.drive();
    const res = await drive.files.create({
      requestBody: { name: file.originalname, parents: folderId ? [folderId] : [env.drive.rootFolderId] },
      media: { mimeType: file.mimetype, body: Readable.from(file.buffer) },
      fields: 'id, name, mimeType, size, webViewLink, webContentLink, thumbnailLink',
    });
    const f = res.data;
    return {
      fileId: f.id,
      name: f.name,
      mime: f.mimeType,
      size: Number(f.size) || file.size,
      url: f.webViewLink,
      thumbUrl: f.thumbnailLink || null,
    };
  }

  async uploadMany(files, opts) {
    const out = [];
    for (const f of files) out.push(await this.upload(f, opts));
    return out;
  }

  stream(fileId) {
    return this.drive().files.get({ fileId, alt: 'media' }, { responseType: 'stream' });
  }

  async remove(fileId) {
    try { await this.drive().files.delete({ fileId }); } catch (e) { logger.warn(`[drive] delete failed ${fileId}: ${e.message}`); }
  }

  async usage(usedBytes) {
    const quota = env.drive.quotaBytes;
    return { usedBytes, quotaBytes: quota, percent: quota ? Math.min(100, Math.round((usedBytes / quota) * 100)) : 0 };
  }
}
module.exports = new StorageService();
