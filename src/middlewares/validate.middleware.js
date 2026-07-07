'use strict';
const { validationResult } = require('express-validator');
const ApiError = require('../core/ApiError');

// Run express-validator chains then collect errors into a single ApiError.
function validate(chains) {
  return async (req, _res, next) => {
    await Promise.all(chains.map((c) => c.run(req)));
    const result = validationResult(req);
    if (result.isEmpty()) return next();
    const msg = result.array().map((e) => e.msg).join(', ');
    next(ApiError.badRequest(msg));
  };
}
module.exports = { validate };
