'use strict';
require('dotenv').config();
const mongoose = require('mongoose');
const env = require('../src/config/env');
const User = require('../src/models/User');
const { ROLES } = require('../src/constants/roles');
const { isStrong } = require('../src/helpers/password.helper');

(async () => {
  await mongoose.connect(env.mongoUri);
  const email = (process.env.SEED_ADMIN_EMAIL || '').toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD;
  if (!email || !password) { console.error('Set SEED_ADMIN_EMAIL & SEED_ADMIN_PASSWORD in .env'); process.exit(1); }
  if (!isStrong(password)) { console.warn('Warning: seed password is weak (min 8, mixed case + number recommended).'); }
  const exists = await User.findOne({ email });
  if (exists) { console.log('Super admin already exists:', email); process.exit(0); }
  await User.create({ name: process.env.SEED_ADMIN_NAME || 'Super Admin', email, password, role: ROLES.SUPER_ADMIN });
  console.log('Super admin created:', email);
  process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
