/**
 * ODOC Digital Archive - application entry point.
 * Boots MongoDB, wires security + middleware, mounts routes, starts HTTP.
 */
const path = require("path");
const express = require("express");
const cookieParser = require("cookie-parser");
const methodOverride = require("method-override");
const expressLayouts = require("express-ejs-layouts");
const morgan = require("morgan");

const env = require("./config/env");
const logger = require("./config/logger");
const { connectDB, disconnectDB } = require("./config/db");

const { applySecurity } = require("./middlewares/security");
const { apiLimiter } = require("./middlewares/rateLimiter");
const { flashMiddleware } = require("./helpers/flash");
const { authenticate } = require("./middlewares/auth");
const { csrfProtection } = require("./middlewares/csrf");
const locals = require("./middlewares/locals");
const notFound = require("./middlewares/notFound");
const errorHandler = require("./middlewares/errorHandler");

const guestRoutes = require("./routes/guest");
const authRoutes = require("./routes/auth");
const adminRoutes = require("./routes/admin");
const apiRoutes = require("./routes/api");

const app = express();
app.set("trust proxy", 1);

// Views
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(expressLayouts);
app.set("layout", "layouts/guest");

// Security + parsers
applySecurity(app);
app.use(morgan(env.isProd ? "combined" : "dev", { stream: logger.stream }));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname, "public")));

// Request context
app.use(flashMiddleware);
app.use(authenticate);
app.use(csrfProtection);
app.use(locals);

// API rate limiting
app.use("/api", apiLimiter);

// Routes
app.use("/api", apiRoutes);
app.use("/", authRoutes);
app.use("/", guestRoutes);
app.use("/admin", adminRoutes);

// Fallbacks
app.use(notFound);
app.use(errorHandler);

let server;
async function start() {
  try {
    await connectDB();
    server = app.listen(env.PORT, () => {
      logger.info(`ODOC Digital Archive running at ${env.APP_URL} (port ${env.PORT}, ${env.NODE_ENV})`);
    });
  } catch (err) {
    logger.error("Failed to start server", { error: err.message });
    process.exit(1);
  }
}

async function shutdown(signal) {
  logger.info(`Received ${signal}, shutting down gracefully`);
  if (server) server.close();
  await disconnectDB();
  process.exit(0);
}
["SIGINT", "SIGTERM"].forEach((sig) => process.on(sig, () => shutdown(sig)));
process.on("unhandledRejection", (reason) => logger.error("Unhandled rejection", { reason: String(reason) }));

if (require.main === module) start();

module.exports = { app, start };
