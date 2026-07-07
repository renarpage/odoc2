/**
 * Runs a validator function (body -> cleaned data) and replaces req.body with
 * the sanitized result. Validators throw ApiError on failure.
 */
module.exports = function validate(validatorFn) {
  return (req, res, next) => {
    try {
      req.body = validatorFn(req.body || {});
      next();
    } catch (err) {
      next(err);
    }
  };
};
