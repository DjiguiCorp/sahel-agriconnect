/**
 * Create a central admin user in MongoDB (CLI).
 * Uses the same Admin model as the API (email + password; password hashed on save).
 *
 * Usage (from repo root):
 *   cd backend && node scripts/createAdmin.js
 *
 * Set MONGO_URI in .env (or MONGODB_URI as fallback). Change EMAIL / PASSWORD below before running.
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Admin from '../models/Admin.js';

dotenv.config();

const MONGO =
  process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/sahel-agriconnect';

const EMAIL = 'admin@sahelagriconnect.org'; // ← change this
const PASSWORD = 'changeme123'; // ← change this before running
const NAME = 'Central Administrator';
const ROLE = 'super-admin';

async function create() {
  await mongoose.connect(MONGO);
  const email = EMAIL.toLowerCase().trim();
  const existing = await Admin.findOne({ email });
  if (existing) {
    console.log(`Admin "${email}" already exists.`);
    process.exit(0);
  }
  await Admin.create({
    email,
    password: PASSWORD,
    name: NAME,
    role: ROLE,
  });
  console.log(`✅ Admin "${email}" created successfully (role: ${ROLE}).`);
  process.exit(0);
}

create().catch((e) => {
  console.error(e);
  process.exit(1);
});
