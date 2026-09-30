import crypto from 'crypto';

// Generates a random raw token (emailed once, never stored) plus its
// SHA-256 hash (the only thing persisted). A leaked database therefore
// cannot be used to reset a password or verify an email on its own.
export const createSecureToken = () => {
  const raw = crypto.randomBytes(32).toString('hex');
  const hash = crypto.createHash('sha256').update(raw).digest('hex');
  return { raw, hash };
};

export const hashToken = (raw) => crypto.createHash('sha256').update(String(raw)).digest('hex');

// First entry of a possibly comma-separated CLIENT_URL, trailing slash trimmed.
export const primaryClientUrl = () =>
  (process.env.CLIENT_URL || 'http://localhost:5173')
    .split(',')[0]
    .trim()
    .replace(/\/+$/, '');
