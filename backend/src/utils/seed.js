/**
 * Seeds the database with the single initial administrator account.
 *
 * There is intentionally no seeded faculty or student data:
 *   - The administrator signs in with the credentials below and creates
 *     faculty/mentor accounts from the admin console (POST /api/mentors).
 *   - Students create their own accounts from the public /register page
 *     using their real email address (e.g. a personal Gmail account) and
 *     verify it before they can sign in.
 *
 * Run with: npm run seed
 * Safe to re-run: it only touches the User collection, and only removes
 * existing admin accounts before recreating the seed admin, so any
 * faculty/student accounts created afterwards are left untouched.
 */
import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

const { default: connectDB } = await import('../config/db.js');
const { default: User } = await import('../models/User.js');
const { ROLES, ACCOUNT_STATUS } = await import('../config/constants.js');

const run = async () => {
  await connectDB();

  console.log('Clearing existing administrator accounts...');
  await User.deleteMany({ role: ROLES.ADMIN });

  console.log('Creating administrator...');
  await User.create({
    name: 'System Administrator',
    email: 'admin@campus.edu',
    password: 'Admin@123',
    role: ROLES.ADMIN,
    status: ACCOUNT_STATUS.ACTIVE,
    emailVerifiedAt: new Date(),
    phone: '9876500000',
    avatarColor: '#4f46e5',
  });

  console.log('\nSeed complete.');
  console.log('------------------------------------------------------------');
  console.log('ADMIN CREDENTIALS (change the password after first login)');
  console.log('------------------------------------------------------------');
  console.log('  admin@campus.edu            Admin@123');
  console.log('------------------------------------------------------------');
  console.log('No faculty or student accounts were seeded.');
  console.log('  - Sign in as admin and create faculty/mentor accounts from');
  console.log('    the admin console.');
  console.log('  - Students create their own accounts at /register using');
  console.log('    their real email address and verifying it.');
  console.log('------------------------------------------------------------');

  await mongoose.connection.close();
  process.exit(0);
};

run().catch(async (err) => {
  console.error('Seed failed:', err);
  await mongoose.connection.close();
  process.exit(1);
});
