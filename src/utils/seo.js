'use strict';
const env = require('../config/env');
function meta(activity) {
  return {
    title: `${activity.title} | ODOC OSIS SMAVO`,
    description: activity.summary || 'Arsip kegiatan OSIS SMAVO',
    canonical: `${env.baseUrl}/activity/${activity.slug}`,
    image: activity.coverImage ? activity.coverImage.url : null,
  };
}
module.exports = { meta };
