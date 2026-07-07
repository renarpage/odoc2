'use strict';
module.exports = (name = 'file') => String(name).replace(/[^\w.\-]+/g, '_').slice(0, 180);
