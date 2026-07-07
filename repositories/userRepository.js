const User = require("../models/User");

module.exports = {
  create: (data) => User.create(data),
  findById: (id) => User.findById(id),
  findByEmail: (email) => User.findOne({ email: String(email).toLowerCase() }),
  findByEmailWithSecret: (email) =>
    User.findOne({ email: String(email).toLowerCase() }).select("+password +refreshTokens"),
  findByIdWithSecret: (id) => User.findById(id).select("+password +refreshTokens"),
  list: (filter = {}) => User.find(filter).sort({ createdAt: -1 }),
  count: (filter = {}) => User.countDocuments(filter),
  updateById: (id, update) => User.findByIdAndUpdate(id, update, { new: true }),
  deleteById: (id) => User.findByIdAndDelete(id),
};
