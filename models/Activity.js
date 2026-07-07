const mongoose = require("mongoose");
const { ACTIVITY_STATUS_VALUES, ACTIVITY_STATUS, ACTIVITY_VISIBILITY } = require("../constants");

const committeeSchema = new mongoose.Schema(
  { name: { type: String, required: true }, role: { type: String, default: "Member" } },
  { _id: false }
);

const milestoneSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    date: { type: String },
    done: { type: Boolean, default: false },
    current: { type: Boolean, default: false },
  },
  { _id: false }
);

const activitySchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true, trim: true },
    category: { type: String, required: true, index: true },
    status: {
      type: String,
      enum: ACTIVITY_STATUS_VALUES,
      default: ACTIVITY_STATUS.UPCOMING,
      index: true,
    },
    date: { type: String }, // display/start date (kept as string for view parity)
    startDate: { type: Date },
    endDate: { type: Date },
    location: { type: String, default: "TBA" },
    organizer: { type: String, default: "OSIS SMAVO" },
    division: { type: String },
    cover: { type: String },
    summary: { type: String, default: "" },
    description: { type: [String], default: [] },
    // Denormalized quick-access media arrays (source of truth is Gallery/Document collections).
    gallery: { type: [String], default: [] },
    documents: {
      type: [
        new mongoose.Schema(
          { name: String, size: String, type: String, url: String, driveId: String },
          { _id: false }
        ),
      ],
      default: [],
    },
    committee: { type: [committeeSchema], default: [] },
    milestones: { type: [milestoneSchema], default: [] },
    tags: { type: [String], default: [], index: true },
    visibility: {
      type: String,
      enum: Object.values(ACTIVITY_VISIBILITY),
      default: ACTIVITY_VISIBILITY.PUBLISHED,
    },
    publishDate: { type: Date },
    featured: { type: Boolean, default: false },
    pinned: { type: Boolean, default: false },
    archived: { type: Boolean, default: false },
    views: { type: Number, default: 0 },
    attendeeAvatarCount: { type: Number, default: 0 },
    driveFolderId: { type: String },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

activitySchema.index({ title: "text", summary: "text", tags: "text" });

/**
 * Map a document to the exact shape the existing EJS views expect.
 * `id` mirrors the slug so guest links (/activity/:id) keep working.
 */
activitySchema.methods.toView = function toView() {
  return {
    id: this.slug,
    _id: this._id.toString(),
    slug: this.slug,
    title: this.title,
    category: this.category,
    status: this.status,
    date: this.date,
    location: this.location,
    organizer: this.organizer,
    division: this.division,
    cover: this.cover,
    summary: this.summary,
    description: this.description,
    gallery: this.gallery,
    documents: this.documents,
    committee: this.committee,
    milestones: this.milestones,
    tags: this.tags,
    visibility: this.visibility,
    featured: this.featured,
    pinned: this.pinned,
    attendeeAvatarCount: this.attendeeAvatarCount,
    views: this.views,
    createdAt: this.createdAt ? this.createdAt.toISOString().slice(0, 10) : "",
  };
};

module.exports = mongoose.model("Activity", activitySchema);
