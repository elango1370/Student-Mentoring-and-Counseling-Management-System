import User from '../models/User.js';
import Mentor from '../models/Mentor.js';
import Student from '../models/Student.js';
import PasswordResetToken from '../models/PasswordResetToken.js';
import EmailVerificationToken from '../models/EmailVerificationToken.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { signToken } from '../utils/token.js';
import { createSecureToken, hashToken, primaryClientUrl } from '../utils/secureToken.js';
import { sendPasswordResetEmail, sendVerificationEmail } from '../utils/email.js';
import { ROLES, ACCOUNT_STATUS } from '../config/constants.js';

const RESET_TOKEN_TTL_MS = 15 * 60 * 1000; // 15 minutes
const VERIFY_TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

// A single generic response for every forgot-password / resend-verification
// request, regardless of whether the email actually matched an account.
// This is what stops the endpoint being used to enumerate registered emails.
const GENERIC_FORGOT_PASSWORD_MESSAGE =
  'If an account exists for that email, a password reset link has been sent.';
const GENERIC_RESEND_VERIFICATION_MESSAGE =
  'If an account exists for that email and needs verifying, a new verification link has been sent.';

const ROLE_LABELS = {
  [ROLES.ADMIN]: 'Admin',
  [ROLES.MENTOR]: 'Faculty/Mentor',
  [ROLES.STUDENT]: 'Student',
};

const buildProfile = async (user) => {
  const base = {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    phone: user.phone,
    avatarColor: user.avatarColor,
    status: user.status,
    lastLogin: user.lastLogin,
  };

  if (user.role === ROLES.MENTOR) {
    const mentor = await Mentor.findOne({ user: user._id });
    return { ...base, mentorId: mentor?._id || null, department: mentor?.department || '', employeeId: mentor?.employeeId || '' };
  }

  if (user.role === ROLES.STUDENT) {
    const student = await Student.findOne({ user: user._id });
    return {
      ...base,
      studentId: student?._id || null,
      rollNumber: student?.rollNumber || '',
      department: student?.department || '',
      year: student?.year || null,
      semester: student?.semester || null,
    };
  }

  return base;
};

const PALETTE = ['#4f46e5', '#0891b2', '#059669', '#d97706', '#dc2626', '#7c3aed', '#db2777'];
const pickColor = () => PALETTE[Math.floor(Math.random() * PALETTE.length)];

/**
 * Issues a fresh verification token for the user (invalidating any earlier
 * unused ones) and emails it. Never throws — a mail delivery hiccup must
 * not fail the registration request itself.
 */
const issueVerificationEmail = async (user) => {
  await EmailVerificationToken.deleteMany({ user: user._id, usedAt: null });
  const { raw, hash } = createSecureToken();
  await EmailVerificationToken.create({
    user: user._id,
    tokenHash: hash,
    expiresAt: new Date(Date.now() + VERIFY_TOKEN_TTL_MS),
  });
  const verifyUrl = `${primaryClientUrl()}/verify-email?token=${raw}`;
  await sendVerificationEmail({ to: user.email, name: user.name, verifyUrl });
};

/**
 * Public student self-registration. Mentor and administrator accounts are
 * still provisioned from the admin console.
 */
export const register = asyncHandler(async (req, res) => {
  const {
    name, email, password, phone, rollNumber, registerNumber, department,
    program, year, semester, section, admissionYear,
  } = req.body;

  const normalisedEmail = String(email).toLowerCase().trim();
  const normalisedRoll = String(rollNumber).toUpperCase().trim();

  if (await User.findOne({ email: normalisedEmail })) {
    throw new ApiError(409, 'An account with this email already exists.');
  }
  if (await Student.findOne({ rollNumber: normalisedRoll })) {
    throw new ApiError(409, 'A student with this roll number already exists.');
  }

  const user = await User.create({
    name,
    email: normalisedEmail,
    password,
    phone: phone || '',
    role: ROLES.STUDENT,
    avatarColor: pickColor(),
  });

  try {
    await Student.create({
      user: user._id,
      rollNumber: normalisedRoll,
      registerNumber: registerNumber || '',
      department,
      program: program || 'B.E.',
      year: Number(year),
      semester: Number(semester),
      section: section || 'A',
      admissionYear: Number(admissionYear) || new Date().getFullYear(),
      mentor: null,
    });
  } catch (err) {
    await User.findByIdAndDelete(user._id);
    throw err;
  }

  await issueVerificationEmail(user);

  res.status(201).json({
    success: true,
    message: 'Account created. Please check your email to verify your address before signing in.',
    requiresVerification: true,
  });
});

// Faculty/mentor accounts are never self-registered — they are created
// exclusively by an administrator via POST /api/mentors (see
// mentorController.createMentor), which activates the account immediately.

export const login = asyncHandler(async (req, res) => {
  const { email, password, role } = req.body;

  const user = await User.findOne({ email: String(email).toLowerCase().trim() }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    throw new ApiError(401, 'Invalid email or password.');
  }

  if (role && role !== user.role) {
    throw new ApiError(
      403,
      `This account is registered as ${ROLE_LABELS[user.role] || user.role}. Please use the ${ROLE_LABELS[role] || role} login.`
    );
  }

  if (user.status === ACCOUNT_STATUS.SUSPENDED || !user.isActive) {
    throw new ApiError(403, 'This account has been suspended. Contact your administrator.');
  }
  if (user.status === ACCOUNT_STATUS.PENDING) {
    throw new ApiError(403, 'This account is pending administrator approval. Please check back later.');
  }
  if (!user.emailVerifiedAt) {
    throw new ApiError(403, 'Please verify your email address before signing in. Check your inbox for the verification link.');
  }

  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  const token = signToken({ id: user._id, role: user.role });
  const profile = await buildProfile(user);

  res.status(200).json({ success: true, message: 'Logged in successfully', token, user: profile });
});

export const getMe = asyncHandler(async (req, res) => {
  const profile = await buildProfile(req.user);
  res.status(200).json({ success: true, user: profile });
});

export const logout = asyncHandler(async (req, res) => {
  res.status(200).json({ success: true, message: 'Logged out successfully' });
});

export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id).select('+password');
  if (!(await user.comparePassword(currentPassword))) {
    throw new ApiError(401, 'Current password is incorrect.');
  }
  user.password = newPassword;
  await user.save();
  res.status(200).json({ success: true, message: 'Password updated successfully' });
});

export const updateMyProfile = asyncHandler(async (req, res) => {
  const { name, phone } = req.body;
  const user = await User.findById(req.user._id);
  if (name) user.name = name;
  if (phone !== undefined) user.phone = phone;
  await user.save();
  const profile = await buildProfile(user);
  res.status(200).json({ success: true, message: 'Profile updated', user: profile });
});

/**
 * Confirms a self-registered account's email address. Public — the token
 * itself is the credential.
 */
export const verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.body;
  if (!token) throw new ApiError(400, 'A verification token is required.');

  const record = await EmailVerificationToken.findOne({ tokenHash: hashToken(token), usedAt: null });
  if (!record || record.expiresAt < new Date()) {
    throw new ApiError(400, 'This verification link is invalid or has expired. Request a new one.');
  }

  const user = await User.findById(record.user);
  if (!user) throw new ApiError(404, 'Account not found.');

  user.emailVerifiedAt = new Date();
  await user.save({ validateBeforeSave: false });
  record.usedAt = new Date();
  await record.save();

  res.status(200).json({
    success: true,
    message: user.status === ACCOUNT_STATUS.PENDING
      ? 'Email verified. Your account still needs administrator approval before you can sign in.'
      : 'Email verified. You can now sign in.',
  });
});

/**
 * Re-sends a verification email. Always returns the same generic response
 * so this cannot be used to probe which emails have accounts or are already
 * verified.
 */
export const resendVerification = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email: String(email).toLowerCase().trim() });

  if (user && !user.emailVerifiedAt) {
    await issueVerificationEmail(user);
  }

  res.status(200).json({ success: true, message: GENERIC_RESEND_VERIFICATION_MESSAGE });
});

/**
 * Starts a password reset. Always returns the same generic response
 * whether or not the email matches an account, so this endpoint cannot be
 * used to enumerate registered users.
 */
export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email: String(email).toLowerCase().trim() });

  if (user) {
    // Invalidate any earlier, still-unused reset request for this user.
    await PasswordResetToken.deleteMany({ user: user._id, usedAt: null });
    const { raw, hash } = createSecureToken();
    await PasswordResetToken.create({
      user: user._id,
      tokenHash: hash,
      expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
    });
    const resetUrl = `${primaryClientUrl()}/reset-password?token=${raw}`;
    await sendPasswordResetEmail({ to: user.email, name: user.name, resetUrl });
  }

  res.status(200).json({ success: true, message: GENERIC_FORGOT_PASSWORD_MESSAGE });
});

/**
 * Completes a password reset: validates the token is unused and unexpired,
 * sets the new password (re-hashed by the User pre-save hook, which also
 * stamps passwordChangedAt), marks the token used, and — because
 * passwordChangedAt just moved forward — every previously issued JWT for
 * this user is now rejected by `protect`, forcing re-login everywhere.
 */
export const resetPassword = asyncHandler(async (req, res) => {
  const { token, newPassword } = req.body;

  const record = await PasswordResetToken.findOne({ tokenHash: hashToken(token), usedAt: null });
  if (!record || record.expiresAt < new Date()) {
    throw new ApiError(400, 'This reset link is invalid or has expired. Request a new one.');
  }

  const user = await User.findById(record.user);
  if (!user) throw new ApiError(404, 'Account not found.');

  user.password = newPassword;
  await user.save();

  record.usedAt = new Date();
  await record.save();

  res.status(200).json({ success: true, message: 'Password reset successfully. Please sign in with your new password.' });
});

/**
 * Invalidates every JWT issued for this account so far — including the one
 * used to make this request — by advancing passwordChangedAt without
 * touching the password itself. The caller must sign in again afterwards.
 */
export const logoutAllDevices = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(req.user._id, { passwordChangedAt: new Date() });
  res.status(200).json({ success: true, message: 'Logged out of all devices. Please sign in again.' });
});
