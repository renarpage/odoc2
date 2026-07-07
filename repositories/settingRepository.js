const Setting = require("../models/Setting");

class SettingRepository {
  get(key) {
    return Setting.findOne({ key });
  }

  async getData(key, fallback = {}) {
    const doc = await Setting.findOne({ key });
    return doc ? doc.data : fallback;
  }

  upsert(key, data) {
    return Setting.findOneAndUpdate(
      { key },
      { $set: { data } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
  }

  async merge(key, patch) {
    const current = await this.getData(key, {});
    const next = { ...current, ...patch };
    return this.upsert(key, next);
  }
}

module.exports = new SettingRepository();
