require("dotenv").config();
const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const methodOverride = require("method-override");
const expressLayouts = require("express-ejs-layouts");

const { connectDB } = require("./config/db");
const env = require("./config/env");
const logger = require("./config/logger");

const { authenticate } = require("./middlewares/auth");
const locals = require("./middlewares/locals");
const maintenance = require("./middlewares/maintenance");
const { securityMiddleware } = require("./middlewares/security");
const { globalLimiter } = require("./middlewares/rateLimiter");
const { flashMiddleware } = require("./helpers/flash");
const errorHandler = require("./middlewares/errorHandler");
const notFound = require("./middlewares/notFound");

const guestRoutes = require("./routes/guest");
const authRoutes = require("./routes/auth");
const adminRoutes = require("./routes/admin");
const apiRoutes = require("./routes/api");

const app = express();

// View engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(expressLayouts);
app.set("layout", "layouts/guest");

// Static assets
app.use(express.static(path.join(__dirname, "public")));

// Body parsing
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use(methodOverride("_method"));

// Security & rate limiting
app.use(securityMiddleware);
app.use(globalLimiter);

// Flash messages (cookie-based)
app.use(flashMiddleware);

// Auth: silently attach user if token present
app.use(authenticate);

// Populate view locals (currentUser, currentPath, flash, settings)
app.use(locals);

// Maintenance mode gate (must come after auth + locals so we know who the user is)
app.use(maintenance);

// Routes
app.use("/api", apiRoutes);
app.use("/", authRoutes);
app.use("/admin", adminRoutes);
app.use("/", guestRoutes);

// 404 & error handling
app.use(notFound);
app.use(errorHandler);

// Boot
async function start() {
  try {
    await connectDB();
    app.listen(env.PORT, () => {
      logger.info(`ODOC Digital Archive running at http://localhost:${env.PORT}`);
    });
  } catch (err) {
    logger.error("Failed to start server", { error: err.message });
    process.exit(1);
  }
}

start();

module.exports = app;
