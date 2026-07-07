/**
 * MongoDB connection manager (Mongoose).
 * Single shared connection with sane pool settings and graceful shutdown.
 */
const mongoose = require("mongoose");
const { env } = require("./env");
const logger = require("../utils/logger");

mongoose.set("strictQuery", true);

let connected = false;

async function connectDB() {
  if (connected) return mongoose.connection;
  try {
    await mongoose.connect(env.mongoUri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
    connected = true;
    logger.info(`MongoDB connected: ${mongoose.connection.host}/${mongoose.connection.name}`);
  } catch (err) {
    logger.error(`MongoDB connection failed: ${err.message}`);
    throw err;
  }

  mongoose.connection.on("error", (err) => logger.error(`MongoDB error: ${err.message}`));
  mongoose.connection.on("disconnected", () => {
    connected = false;
    logger.warn("MongoDB disconnected");
  });

  return mongoose.connection;
}

async function disconnectDB() {
  if (!connected) return;
  await mongoose.connection.close();
  connected = false;
  logger.info("MongoDB connection closed");
}

function isConnected() {
  return mongoose.connection.readyState === 1;
}

module.exports = { connectDB, disconnectDB, isConnected, mongoose };
