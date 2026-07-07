/**
 * Wraps async route/controller handlers so rejected promises are forwarded
 * to Express error middleware instead of crashing the process.
 */
module.exports = function asyncHandler(fn) {
  return function (req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
