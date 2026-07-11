//==============================================================//
//  CONFIG — MongoDB connection (Mongoose)                      //
//  Connection is cached on globalThis so warm serverless        //
//  invocations reuse it instead of opening a new one each time  //
//  (which would exhaust the Atlas connection limit).            //
//==============================================================//
const mongoose = require("mongoose");
const env = require("./env");
const logger = require("./logger");

mongoose.set("strictQuery", true);

// Reuse a single connection/promise across module reloads & invocations.
let cached = globalThis._odocMongoose;
if (!cached) {
  cached = globalThis._odocMongoose = { conn: null, promise: null, bound: false };
}

function bindEvents() {
  if (cached.bound) return;
  cached.bound = true;
  mongoose.connection.on("connected", () => logger.info("MongoDB connected"));
  mongoose.connection.on("error", (err) => logger.error("MongoDB error", { error: err.message }));
  mongoose.connection.on("disconnected", () => logger.warn("MongoDB disconnected"));
}

async function connectDB() {
  if (cached.conn) return cached.conn;
  bindEvents();
  if (!cached.promise) {
    cached.promise = mongoose
      .connect(env.MONGO_URI, { serverSelectionTimeoutMS: 10000, maxPoolSize: 10 })
      .then((m) => m.connection);
  }
  cached.conn = await cached.promise;
  return cached.conn;
}

async function disconnectDB() {
  if (!cached.conn) return;
  await mongoose.disconnect();
  cached.conn = null;
  cached.promise = null;
}

// readyState 1 === connected
async function healthCheck() {
  return mongoose.connection.readyState === 1;
}

module.exports = { connectDB, disconnectDB, healthCheck, mongoose };
