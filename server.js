//==============================================================//
//  SERVER — Application entry point                            //
//  Boots MongoDB, wires the middleware chain, mounts routes.   //
//==============================================================//
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
const { applySecurity } = require("./middlewares/security");
const { apiLimiter } = require("./middlewares/rateLimiter");
const { csrfProtection } = require("./middlewares/csrf");
const { flashMiddleware } = require("./helpers/flash");
const errorHandler = require("./middlewares/errorHandler");
const notFound = require("./middlewares/notFound");

const guestRoutes = require("./routes/guest");
const authRoutes = require("./routes/auth");
const adminRoutes = require("./routes/admin");
const apiRoutes = require("./routes/api");

const app = express();

//==============================================================//
//  VIEW ENGINE                                                 //
//==============================================================//
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(expressLayouts);
app.set("layout", "layouts/guest");

//==============================================================//
//  CORE MIDDLEWARE                                             //
//==============================================================//
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use(methodOverride("_method"));

// Security headers + NoSQL sanitization, then rate limiting.
applySecurity(app);
app.use(apiLimiter);

// Cookie-based flash messages.
app.use(flashMiddleware);

// Attach the current user (silent JWT refresh) if a token is present.
app.use(authenticate);

// Issue/verify CSRF token and expose it to views.
app.use(csrfProtection);

// Per-request view locals (currentUser, flash, settings).
app.use(locals);

// Gate public traffic when maintenance mode is on (admins bypass).
app.use(maintenance);

//==============================================================//
//  ROUTES                                                      //
//==============================================================//
app.use("/api", apiRoutes);
app.use("/", authRoutes);
app.use("/admin", adminRoutes);
app.use("/", guestRoutes);

//==============================================================//
//  ERROR HANDLING                                              //
//==============================================================//
app.use(notFound);
app.use(errorHandler);

//==============================================================//
//  BOOT                                                        //
//==============================================================//
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
