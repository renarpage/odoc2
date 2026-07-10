//==============================================================//
//  CONFIG — MongoDB connection (Mongoose)                      //
//==============================================================//
const mongoose = require("mongoose");
const env = require("./env");
const logger = require("./logger");

mongoose.set("strictQuery", true);

let connected = false;

async function connectDB() {
  if (connected) return mongoose.connection;
  mongoose.connection.on("connected", () => logger.info("MongoDB connected"));
  mongoose.connection.on("error", (err) => logger.error("MongoDB error", { error: err.message }));
  mongoose.connection.on("disconnected", () => logger.warn("MongoDB disconnected"));

  await mongoose.connect(env.MONGO_URI, {
    serverSelectionTimeoutMS: 10000,
    maxPoolSize: 20,
  });
  connected = true;
  return mongoose.connection;
}

async function disconnectDB() {
  if (!connected) return;
  await mongoose.disconnect();
  connected = false;
}

// readyState 1 === connected
async function healthCheck() {
  return mongoose.connection.readyState === 1;
}

module.exports = { connectDB, disconnectDB, healthCheck, mongoose };
