//==============================================================//
//  REPOSITORY — Otp                                           //
//==============================================================//
const Otp = require("../models/Otp");

class OtpRepository {
  findByEmail(email) {
    return Otp.findOne({ email });
  }

  // Upsert so there is at most one active code per email.
  upsert(email, data) {
    return Otp.findOneAndUpdate(
      { email },
      { $set: { email, ...data } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
  }

  incAttempts(email) {
    return Otp.findOneAndUpdate({ email }, { $inc: { attempts: 1 } }, { new: true });
  }

  deleteByEmail(email) {
    return Otp.deleteOne({ email });
  }
}

module.exports = new OtpRepository();
