'use strict';
const ROLES = {
  SUPER_ADMIN: 'super_admin',
  STANDARD_ADMIN: 'standard_admin',
};
ROLES.all = [ROLES.SUPER_ADMIN, ROLES.STANDARD_ADMIN];
Object.freeze(ROLES);
module.exports = { ROLES };
