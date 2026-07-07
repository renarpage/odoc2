'use strict';
const path = require('path');
const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const morgan = require('morgan');
const flash = require('connect-flash');

const env = require('./config/env');
const { applySecurity } = require('./middlewares/security.middleware');
const { globalLimiter } = require('./middlewares/rateLimiter.middleware');
const { attachUser } = require('./middlewares/auth.middleware');
const visitorTracker = require('./middlewares/visitor.middleware');
const notFound = require('./middlewares/notFound.middleware');
const errorHandler = require('./middlewares/error.middleware');
const settingService = require('./services/setting.service');
const routes = require('./routes');

const app = express();

app.set('trust proxy', 1);
app.set('view engine', 'ejs');
// Reuse the existing frontend views at project root; new views live in src/views.
app.set('views', [path.join(__dirname, '..', 'views'), path.join(__dirname, 'views')]);
app.use(expressLayouts);
app.set('layout', 'layouts/guest');

app.use(compression());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser(env.cookieSecret));
app.use(morgan(env.isProd ? 'combined' : 'dev'));
applySecurity(app);
app.use(globalLimiter);
app.use(flash());

// Existing frontend assets (public/) + new theme assets (src/public/).
app.use('/static', express.static(path.join(__dirname, '..', 'public'), { maxAge: '7d', etag: true }));
app.use('/assets', express.static(path.join(__dirname, 'public'), { maxAge: '7d', etag: true }));

app.use(attachUser);
app.use(visitorTracker);

// Inject current user + live branding into every view.
app.use(async (req, res, next) => {
  res.locals.user = req.user || null;
  try { res.locals.branding = await settingService.get(); } catch { res.locals.branding = {}; }
  res.locals.flash = { success: req.flash('success'), error: req.flash('error') };
  next();
});

app.use('/', routes);
app.use(notFound);
app.use(errorHandler);

module.exports = app;
