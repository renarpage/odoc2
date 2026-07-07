'use strict';
const slugify = require('slugify');
const activityRepo = require('../repositories/activity.repository');
const logRepo = require('../repositories/log.repository');
const storageService = require('./storage.service');
const notificationService = require('./notification.service');
const cache = require('../config/cache');
const ApiError = require('../core/ApiError');
const { deriveStatus } = require('../constants/activityStatus');

class ActivityService {
  async uniqueSlug(title, existingId) {
    const base = slugify(title, { lower: true, strict: true });
    let slug = base;
    let n = 1;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const found = await activityRepo.findBySlug(slug);
      if (!found || String(found._id) === String(existingId)) return slug;
      slug = `${base}-${n++}`;
    }
  }

  invalidate() { cache.del(cache.keys().filter((k) => k.startsWith('activities:') || k === 'dashboard:stats')); }

  async create(data, user) {
    const slug = await this.uniqueSlug(data.title);
    const status = data.status || deriveStatus(data.startDate, data.endDate);
    let driveFolderId = null;
    try { driveFolderId = await storageService.ensureActivityFolder(data.title, slug); } catch { /* Drive optional in dev */ }
    const activity = await activityRepo.create({ ...data, slug, status, driveFolderId, createdBy: user.sub, updatedBy: user.sub });
    await logRepo.create({ action: 'activity.create', entity: 'Activity', entityId: String(activity._id), actor: user.sub, actorEmail: user.name });
    await notificationService.success('Activity dibuat', `"${activity.title}" berhasil dibuat`, { user: user.sub });
    this.invalidate();
    return activity;
  }

  async update(id, patch, user) {
    if (patch.title) patch.slug = await this.uniqueSlug(patch.title, id);
    if (patch.startDate || patch.endDate) patch.status = patch.status || deriveStatus(patch.startDate, patch.endDate);
    patch.updatedBy = user.sub;
    const activity = await activityRepo.updateById(id, patch);
    await logRepo.create({ action: 'activity.update', entity: 'Activity', entityId: id, actor: user.sub });
    this.invalidate();
    return activity;
  }

  async remove(id, user) {
    const activity = await activityRepo.findById(id);
    if (!activity) throw ApiError.notFound('Activity tidak ditemukan');
    const files = [...(activity.gallery || []), ...(activity.documents || [])];
    await Promise.all(files.map((f) => storageService.remove(f.fileId)));
    await activityRepo.deleteById(id);
    await logRepo.create({ action: 'activity.delete', entity: 'Activity', entityId: id, actor: user.sub });
    this.invalidate();
  }

  async duplicate(id, user) {
    const src = await activityRepo.findById(id);
    if (!src) throw ApiError.notFound('Activity tidak ditemukan');
    const copy = src.toObject();
    delete copy._id; delete copy.createdAt; delete copy.updatedAt;
    copy.title = `${copy.title} (Copy)`;
    copy.isDraft = true;
    return this.create(copy, user);
  }

  setDraft(id, isDraft, user) { return this.update(id, { isDraft, publishDate: isDraft ? null : new Date() }, user); }
  archive(id, archived, user) { return this.update(id, { archived }, user); }

  async listPublic(query) {
    const key = `activities:pub:${JSON.stringify(query)}`;
    const cached = cache.get(key);
    if (cached) return cached;
    const res = await activityRepo.paginate({ ...query, publicOnly: true });
    cache.set(key, res, 60);
    return res;
  }

  listAdmin(query) { return activityRepo.paginate(query); }

  async getPublicBySlug(slug) {
    const activity = await activityRepo.findBySlug(slug);
    if (!activity || activity.isDraft || activity.visibility !== 'public') throw ApiError.notFound('Activity tidak ditemukan');
    await activityRepo.incrementViews(activity._id);
    const related = await activityRepo.relatedTo(activity);
    return { activity, related };
  }
}
module.exports = new ActivityService();
