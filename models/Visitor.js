const mongoose = require("mongoose");

// One doc per visit; analytics computed via aggregation/count.
const visitorSchema = new mongoose.Schema(
  {
    ipHash: { type: String, index: true },
    sessionId: { type: String, index: true },
    path: { type: String, default: "/" },
    activity: { type: mongoose.Schema.Types.ObjectId, ref: "Activity", default: null },
    userAgent: { type: String, default: "" },
  },
  { timestamps: true }
);

visitorSchema.index({ createdAt: 1 });

module.exports = mongoose.model("Visitor", visitorSchema);
