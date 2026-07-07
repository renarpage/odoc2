'use strict';
require('dotenv').config();

function required(key) {
  const v = process.env[key];
  if (!v && process.env.NODE_ENV === 'production') {
    throw new Error(`Missing required env: ${key}`);
  }
  return v;
}

module.exports = {
  env: process.env.NODE_ENV || 'development',
  isProd: process.env.NODE_ENV === 'production',
  port: Number(process.env.PORT) || 3000,
  baseUrl: process.env.BASE_URL || 'http://localhost:3000',
  mongoUri: required('MONGO_URI') || 'mongodb://127.0.0.1:27017/odoc',
  jwt: {
    accessSecret: required('JWT_ACCESS_SECRET') || 'dev_access',
    refreshSecret: required('JWT_REFRESH_SECRET') || 'dev_refresh',
    accessExpires: process.env.JWT_ACCESS_EXPIRES || '15m',
    refreshExpires: process.env.JWT_REFRESH_EXPIRES || '7d',
  },
  cookieSecret: process.env.COOKIE_SECRET || 'dev_cookie',
  drive: {
    clientEmail: process.env.GDRIVE_CLIENT_EMAIL,
    privateKey: (process.env.GDRIVE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
    rootFolderId: process.env.GDRIVE_ROOT_FOLDER_ID,
    quotaBytes: Number(process.env.GDRIVE_QUOTA_BYTES) || 16106127360,
  },
  uploads: {
    maxImage: (Number(process.env.MAX_IMAGE_MB) || 10) * 1024 * 1024,
    maxVideo: (Number(process.env.MAX_VIDEO_MB) || 200) * 1024 * 1024,
    maxDoc: (Number(process.env.MAX_DOC_MB) || 25) * 1024 * 1024,
  },
};
