'use strict';
const settingRepo = require('../repositories/setting.repository');
const logRepo = require('../repositories/log.repository');
const cache = require('../config/cache');

class SettingService {
  async get() {
    const cached = cache.get('settings:global');
    if (cached) return cached;
    const doc = await settingRepo.get();
    cache.set('settings:global', doc, 300);
    return doc;
  }
  async update(patch, user) {
    const doc = await settingRepo.upsert(patch, user.sub);
    await logRepo.create({ action: 'setting.update', entity: 'Setting', actor: user.sub, meta: patch });
    cache.del('settings:global');
    return doc;
  }
}
module.exports = new SettingService();
