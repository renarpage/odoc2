'use strict';
// Whitelist object keys - keeps controllers from passing unexpected fields to the DB.
module.exports = (obj, keys) => keys.reduce((acc, k) => {
  if (obj != null && Object.prototype.hasOwnProperty.call(obj, k) && obj[k] !== '') acc[k] = obj[k];
  return acc;
}, {});
