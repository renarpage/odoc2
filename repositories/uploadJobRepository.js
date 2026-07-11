//==============================================================//
//  REPOSITORY — UploadJob                                     //
//==============================================================//
const UploadJob = require("../models/UploadJob");

class UploadJobRepository {
  create(data) {
    return UploadJob.create(data);
  }

  findById(id) {
    return UploadJob.findById(id);
  }

  // Newest first for the current admin.
  listForUser(user) {
    return UploadJob.find({ user }).sort({ createdAt: -1 });
  }
}

module.exports = new UploadJobRepository();
