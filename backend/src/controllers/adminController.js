import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { ROLES, ACCOUNT_STATUS } from '../config/constants.js';

const PALETTE = ['#4f46e5', '#0891b2', '#059669', '#d97706', '#dc2626', '#7c3aed', '#db2777'];
const pickColor = () => PALETTE[Math.floor(Math.random() * PALETTE.length)];

/**
 * Lists administrator accounts only. Only reachable by an authenticated
 * admin (see routes/adminRoutes.js), which is the sole way this list — or
 * the ability to create another row in it — is ever exposed.
 */
export const listAdmins = asyncHandler(async (req, res) => {
  const admins = await User.find({ role: ROLES.ADMIN }).select('name email phone avatarColor isActive status lastLogin createdAt').sort({ createdAt: 1 });
  res.status(200).json({ success: true, data: admins });
});

/**
 * Creates another administrator account. There is no public registration
 * path for the admin role anywhere in the API — this is the only way a new
 * admin account can ever be created after the initial seed/setup.
 */
export const createAdmin = asyncHandler(async (req, res) => {
  const { name, email, password, phone } = req.body;
  const normalisedEmail = String(email).toLowerCase().trim();

  if (await User.findOne({ email: normalisedEmail })) {
    throw new ApiError(409, 'A user with this email already exists.');
  }

  const admin = await User.create({
    name,
    email: normalisedEmail,
    password,
    phone: phone || '',
    role: ROLES.ADMIN,
    status: ACCOUNT_STATUS.ACTIVE,
    emailVerifiedAt: new Date(),
    avatarColor: pickColor(),
  });

  res.status(201).json({
    success: true,
    message: 'Administrator account created successfully.',
    data: { id: admin._id, name: admin.name, email: admin.email },
  });
});

/**
 * Suspend or reactivate another administrator account. An admin can never
 * change their own status this way (prevents accidental self-lockout).
 */
export const updateAdminStatus = asyncHandler(async (req, res) => {
  if (req.params.id === String(req.user._id)) {
    throw new ApiError(400, 'You cannot change the status of your own account.');
  }
  const admin = await User.findOne({ _id: req.params.id, role: ROLES.ADMIN });
  if (!admin) throw new ApiError(404, 'Administrator not found.');

  admin.status = req.body.status;
  admin.isActive = req.body.status === ACCOUNT_STATUS.ACTIVE;
  await admin.save();

  res.status(200).json({ success: true, message: 'Administrator status updated.' });
});
