'use strict';
const NOTIFICATION_TYPES = {
  SUCCESS: 'success',
  WARNING: 'warning',
  ERROR: 'error',
  INFO: 'info',
};
NOTIFICATION_TYPES.all = Object.values(NOTIFICATION_TYPES);
Object.freeze(NOTIFICATION_TYPES);

const NOTIFICATION_SCOPE = Object.freeze({ PUBLIC: 'public', ADMIN: 'admin' });

module.exports = { NOTIFICATION_TYPES, NOTIFICATION_SCOPE };
