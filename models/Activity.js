const mongoose = require("mongoose");
const { ACTIVITY_STATUS, VISIBILITY } = require("../constants");

const milestoneSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    date: { type: String, required: true },
    done: { type: Boolean, default: false },
    current: { type: Boolean, default: false },
  },
  { _id: false }
);

const committeeSchema = new mongoose.Schema(
  { name: { type: String, required: true }, role: { type: String, default: "Member" } },
  { _id: false }
);

const embeddedDocSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    size: { type: String, default: "" },
    type: { type: String, default: "pdf" },
    driveId: { type: String, default: null },
    url: { type: String, default: null },
  },
  { _id: false }
);

const activitySchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, index: true },
    summary: { type: String, default: "" },
    description: { type: [String], default: [] },
    category: { type: String, default: "Archive Gallery", index: true },
    status: { type: String, enum: Object.values(ACTIVITY_STATUS), default: ACTIVITY_STATUS.UPCOMING, index: true },
    date: { type: Date, required: true },
    endDate: { type: Date, default: null },
    location: { type: String, default: "TBA" },
    organizer: { type: String, default: "OSIS SMAVO" },
    division: { type: String, default: "" },
    cover: { type: String, default: "" },
    coverDriveId: { type: String, default: null },
    gallery: { type: [String], default: [] },
    documents: { type: [embeddedDocSchema], default: [] },
    committee: { type: [committeeSchema], default: [] },
    milestones: { type: [milestoneSchema], default: [] },
    tags: { type: [String], default: [], index: true },
    visibility: { type: String, enum: Object.values(VISIBILITY), default: VISIBILITY.PUBLIC, index: true },
    featured: { type: Boolean, default: false },
    pinned: { type: Boolean, default: false },
    publishDate: { type: Date, default: null },
    attendeeAvatarCount: { type: Number, default: 0 },
    views: { type: Number, default: 0 },
    driveFolderId: { type: String, default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

// Full-text search across the fields the guest search targets.
activitySchema.index({ title: "text", summary: "text", description: "text", tags: "text" });

module.exports = mongoose.model("Activity", activitySchema);
