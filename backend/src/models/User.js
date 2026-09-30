import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { ROLES, ACCOUNT_STATUS, ACCOUNT_STATUSES } from '../config/constants.js';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [80, 'Name cannot exceed 80 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please provide a valid email address'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false,
    },
    role: {
      type: String,
      enum: Object.values(ROLES),
      required: true,
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    avatarColor: {
      type: String,
      default: '#4f46e5',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    // Account approval/lifecycle state. Self-registered faculty/mentor accounts
    // start as "pending" until an administrator approves them; students and
    // admin-created accounts are "active" immediately. This is the single
    // source of truth checked at login time.
    status: {
      type: String,
      enum: ACCOUNT_STATUSES,
      default: ACCOUNT_STATUS.ACTIVE,
    },
    lastLogin: {
      type: Date,
      default: null,
    },
    // Set once the user clicks the verification link emailed at sign-up.
    // Admin-created and seeded accounts are marked verified immediately
    // since an administrator vouches for them directly.
    emailVerifiedAt: {
      type: Date,
      default: null,
    },
    // Set whenever the password changes (self-service change or reset).
    // The auth middleware rejects any JWT issued before this timestamp,
    // which is how "log out of every device" works without a server-side
    // session/refresh-token store.
    passwordChangedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  // Only stamp this on an actual change to an existing account — not on
  // initial creation, when no prior token could exist to invalidate.
  if (!this.isNew) this.passwordChangedAt = new Date();
  return next();
});

userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

// `iat` is the JWT's issued-at time, in seconds since epoch. Any token
// issued before the last password change is considered stale.
userSchema.methods.tokenIssuedBeforePasswordChange = function tokenIssuedBeforePasswordChange(iat) {
  if (!this.passwordChangedAt || !iat) return false;
  return Math.floor(this.passwordChangedAt.getTime() / 1000) > iat;
};

userSchema.index({ role: 1 });

const User = mongoose.model('User', userSchema);
export default User;
