//==============================================================//
//  MODEL — User (admin accounts)                               //
//==============================================================//
const mongoose = require("mongoose");
const { ROLES } = require("../constants");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: Object.values(ROLES), default: ROLES.STANDARD_ADMIN, index: true },
    active: { type: Boolean, default: true },
    mustChangePassword: { type: Boolean, default: true },
    lastLoginAt: { type: Date, default: null },
    lastLoginIp: { type: String, default: null },
    avatarColor: { type: String, default: "#3155E7" },
  },
  { timestamps: true }
);

// Never expose the password hash; normalize _id -> id in JSON.
userSchema.set("toJSON", {
  virtuals: true,
  transform: (_doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    delete ret.passwordHash;
    return ret;
  },
});

module.exports = mongoose.model("User", userSchema);
