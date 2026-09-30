import mongoose from 'mongoose';

const emailVerificationTokenSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    // Only the SHA-256 hash of the raw token is ever stored, matching
    // PasswordResetToken — the raw token exists only in the emailed link.
    tokenHash: {
      type: String,
      required: true,
      unique: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    usedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// MongoDB TTL index: expired tokens are cleaned up automatically.
emailVerificationTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const EmailVerificationToken = mongoose.model('EmailVerificationToken', emailVerificationTokenSchema);
export default EmailVerificationToken;
