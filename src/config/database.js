'use strict';
const mongoose = require('mongoose');
const env = require('./env');
const logger = require('./logger');

mongoose.set('strictQuery', true);

async function connectDatabase() {
  await mongoose.connect(env.mongoUri, { autoIndex: !env.isProd, serverSelectionTimeoutMS: 10000, maxPoolSize: 10 });
  logger.info('MongoDB connected');
  mongoose.connection.on('disconnected', () => logger.warn('MongoDB disconnected'));
  return mongoose.connection;
}

async function disconnectDatabase() {
  await mongoose.connection.close();
}

module.exports = { connectDatabase, disconnectDatabase, mongoose };
