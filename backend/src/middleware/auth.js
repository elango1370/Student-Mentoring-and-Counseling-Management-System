import User from '../models/User.js';
import Mentor from '../models/Mentor.js';
import Student from '../models/Student.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { verifyToken } from '../utils/token.js';
import { ROLES } from '../config/constants.js';

export const protect = asyncHandler(async (req, res, next) => {
  let token = null;
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) {
    token = header.split(' ')[1];
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    throw new ApiError(401, 'Not authorized. No token provided.');
  }

  let decoded;
  try {
    decoded = verifyToken(token);
  } catch (err) {
    throw new ApiError(401, 'Session expired or token invalid. Please log in again.');
  }

  const user = await User.findById(decoded.id);
  if (!user) throw new ApiError(401, 'The user belonging to this token no longer exists.');

  if (user.tokenIssuedBeforePasswordChange(decoded.iat)) {
    throw new ApiError(401, 'Your password was changed. Please log in again.');
  }

  if (user.status === 'suspended' || !user.isActive) {
    throw new ApiError(403, 'This account has been suspended. Contact your administrator.');
  }
  if (user.status === 'pending') {
    throw new ApiError(403, 'This account is pending administrator approval.');
  }

  req.user = user;

  if (user.role === ROLES.MENTOR) {
    req.mentorProfile = await Mentor.findOne({ user: user._id });
  } else if (user.role === ROLES.STUDENT) {
    req.studentProfile = await Student.findOne({ user: user._id });
  }

  return next();
});

// Alias matching the requested naming convention; identical behaviour to `protect`.
export const authenticateUser = protect;

export const authorize =
  (...roles) =>
  (req, res, next) => {
    if (!req.user) return next(new ApiError(401, 'Not authorized.'));
    if (!roles.includes(req.user.role)) {
      return next(new ApiError(403, 'You do not have permission to perform this action.'));
    }
    return next();
  };

// Named single-role guards, built on top of `authorize`, so every protected
// route can express its requirement explicitly rather than relying on the
// frontend to hide UI for the wrong role.
export const requireRole = (...roles) => authorize(...roles);
export const requireAdmin = authorize(ROLES.ADMIN);
export const requireFaculty = authorize(ROLES.MENTOR);
export const requireStudent = authorize(ROLES.STUDENT);
