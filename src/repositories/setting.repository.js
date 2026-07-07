'use strict';
const Setting = require('../models/Setting');

class SettingRepository {
  async get() {
    let doc = await Setting.findOne({ key: 'global' });
    if (!doc) doc = await Setting.create({ key: 'global' });
    return doc;
  }
  async upsert(patch, userId) {
    return Setting.findOneAndUpdate(
      { key: 'global' },
      { ...patch, updatedBy: userId },
      { new: true, upsert: true, runValidators: true },
    );
  }
}
module.exports = new SettingRepository();
