'use strict';
// Lightweight password policy check reused by validators and seed.
function isStrong(pw) {
  return typeof pw === 'string' && pw.length >= 8 && /[a-z]/.test(pw) && /[A-Z]/.test(pw) && /[0-9]/.test(pw);
}
module.exports = { isStrong };
