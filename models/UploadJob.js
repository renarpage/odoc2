//==============================================================//
//  MODEL — UploadJob (background media uploads)                 //
//  Progress is persisted so it survives restarts and is         //
//  visible across instances. Finished jobs self-clean via TTL.  //
//==============================================================//
const mongoose = require("mongoose");

const uploadJobSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    title: { type: String, default: "" },
    slug: { type: String, default: "" },
    total: { type: Number, default: 0 },
    done: { type: Number, default: 0 },
    failed: { type: Number, default: 0 },
    current: { type: String, default: null },
    status: { type: String, enum: ["uploading", "done", "partial", "error"], default: "uploading" },
    error: { type: String, default: null },
    startedAt: { type: Date, default: Date.now },
    finishedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// TTL: remove a job 60s after it finishes (finishedAt=null is ignored, so
// in-progress jobs are never purged). Keeps the dashboard list tidy.
uploadJobSchema.index({ finishedAt: 1 }, { expireAfterSeconds: 60 });

module.exports = mongoose.model("UploadJob", uploadJobSchema);
