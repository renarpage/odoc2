const Setting = require("../models/Setting");

async function getGlobal() {
  let doc = await Setting.findOne({ key: "global" });
  if (!doc) doc = await Setting.create({ key: "global" });
  return doc;
}

module.exports = {
  getGlobal,
  update: (update) =>
    Setting.findOneAndUpdate({ key: "global" }, update, { new: true, upsert: true }),
};
