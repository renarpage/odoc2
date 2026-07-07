const mongoose = require("mongoose");

// Key/value singletons: e.g. key="branding", key="system".
const settingSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, index: true },
    data: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true, minimize: false }
);

module.exports = mongoose.model("Setting", settingSchema);
