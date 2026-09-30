import express from 'express';
import {
  register, login, logout, getMe, changePassword, updateMyProfile,
  verifyEmail, resendVerification, forgotPassword, resetPassword, logoutAllDevices,
} from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import validate from '../middleware/validate.js';
import {
  registerRules, loginRules, changePasswordRules,
  verifyEmailRules, resendVerificationRules, forgotPasswordRules, resetPasswordRules,
} from '../middleware/validators.js';

const router = express.Router();

// Public self-registration is student-only. Faculty/mentor accounts are
// provisioned exclusively by an administrator (see POST /api/mentors),
// so there is no public register-faculty route.
router.post('/register', registerRules, validate, register);
router.post('/login', loginRules, validate, login);
router.post('/logout', protect, logout);
router.post('/logout-all', protect, logoutAllDevices);
router.get('/me', protect, getMe);
router.patch('/me', protect, updateMyProfile);
router.patch('/change-password', protect, changePasswordRules, validate, changePassword);

router.post('/verify-email', verifyEmailRules, validate, verifyEmail);
router.post('/resend-verification', resendVerificationRules, validate, resendVerification);
router.post('/forgot-password', forgotPasswordRules, validate, forgotPassword);
router.post('/reset-password', resetPasswordRules, validate, resetPassword);

export default router;
