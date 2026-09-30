import { body, param } from 'express-validator';
import {
  EXAM_TYPES, ATTENDANCE_STATUS, SESSION_TYPES, SESSION_STATUS, SESSION_MODES,
  REMARK_CATEGORIES, INTERVENTION_TYPES, INTERVENTION_STATUS, PRIORITIES,
  ROLES, ACCOUNT_STATUSES,
} from '../config/constants.js';

export const objectId = (name) => param(name).isMongoId().withMessage('Invalid identifier');

// Enforced when a password is created or changed (registration, admin
// creation, change-password, reset-password) — NOT re-checked at login,
// since a correct historical password must still be accepted there even if
// it predates this policy.
const STRONG_PASSWORD_MESSAGE = 'Password must be at least 8 characters and include an uppercase letter, a lowercase letter and a number';
export const isStrongPassword = (value) => /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(String(value));
const strongPassword = (field) => body(field).custom(isStrongPassword).withMessage(STRONG_PASSWORD_MESSAGE);

export const loginRules = [
  body('email').isEmail().withMessage('A valid email is required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
  body('role').optional().isIn(Object.values(ROLES)).withMessage('Invalid login role'),
];

export const changePasswordRules = [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  strongPassword('newPassword'),
];

export const forgotPasswordRules = [
  body('email').isEmail().withMessage('A valid email is required').normalizeEmail(),
];

export const resetPasswordRules = [
  body('token').trim().notEmpty().withMessage('Reset token is required'),
  strongPassword('newPassword'),
];

export const verifyEmailRules = [
  body('token').trim().notEmpty().withMessage('Verification token is required'),
];

export const resendVerificationRules = [
  body('email').isEmail().withMessage('A valid email is required').normalizeEmail(),
];

export const registerRules = [
  body('name').trim().isLength({ min: 2, max: 80 }).withMessage('Name must be 2-80 characters'),
  body('email').isEmail().withMessage('A valid email is required'),
  strongPassword('password'),
  body('rollNumber').trim().notEmpty().withMessage('Roll number is required'),
  body('department').trim().notEmpty().withMessage('Department is required'),
  body('year').isInt({ min: 1, max: 5 }).withMessage('Year must be between 1 and 5'),
  body('semester').isInt({ min: 1, max: 10 }).withMessage('Semester must be between 1 and 10'),
  body('phone').optional({ checkFalsy: true }).trim().isLength({ min: 6, max: 18 }).withMessage('Enter a valid phone number'),
];

export const adminCreateRules = [
  body('name').trim().isLength({ min: 2, max: 80 }).withMessage('Name must be 2-80 characters'),
  body('email').isEmail().withMessage('A valid email is required'),
  strongPassword('password'),
  body('phone').optional({ checkFalsy: true }).trim().isLength({ min: 6, max: 18 }).withMessage('Enter a valid phone number'),
];

export const accountStatusRules = [
  body('status').isIn(ACCOUNT_STATUSES).withMessage('Invalid account status'),
];

export const studentCreateRules = [
  body('name').trim().isLength({ min: 2, max: 80 }).withMessage('Name must be 2-80 characters'),
  body('email').isEmail().withMessage('A valid email is required'),
  strongPassword('password'),
  body('rollNumber').trim().notEmpty().withMessage('Roll number is required'),
  body('department').trim().notEmpty().withMessage('Department is required'),
  body('year').isInt({ min: 1, max: 5 }).withMessage('Year must be between 1 and 5'),
  body('semester').isInt({ min: 1, max: 10 }).withMessage('Semester must be between 1 and 10'),
];

export const studentUpdateRules = [
  body('email').optional().isEmail().withMessage('A valid email is required'),
  body('name').optional().trim().isLength({ min: 2, max: 80 }).withMessage('Name must be 2-80 characters'),
  body('year').optional().isInt({ min: 1, max: 5 }).withMessage('Year must be between 1 and 5'),
  body('semester').optional().isInt({ min: 1, max: 10 }).withMessage('Semester must be between 1 and 10'),
  body('password').optional().custom((v) => !v || isStrongPassword(v)).withMessage('Password must be at least 8 characters and include an uppercase letter, a lowercase letter and a number'),
];

export const mentorCreateRules = [
  body('name').trim().isLength({ min: 2, max: 80 }).withMessage('Name must be 2-80 characters'),
  body('email').isEmail().withMessage('A valid email is required'),
  strongPassword('password'),
  body('employeeId').trim().notEmpty().withMessage('Employee ID is required'),
  body('department').trim().notEmpty().withMessage('Department is required'),
  body('maxStudents').optional().isInt({ min: 1, max: 200 }).withMessage('Max students must be 1-200'),
];

export const mentorUpdateRules = [
  body('email').optional().isEmail().withMessage('A valid email is required'),
  body('name').optional().trim().isLength({ min: 2, max: 80 }).withMessage('Name must be 2-80 characters'),
  body('maxStudents').optional().isInt({ min: 1, max: 200 }).withMessage('Max students must be 1-200'),
  body('password').optional().custom((v) => !v || isStrongPassword(v)).withMessage('Password must be at least 8 characters and include an uppercase letter, a lowercase letter and a number'),
];

export const assignRules = [
  body('studentIds').isArray({ min: 1 }).withMessage('Select at least one student'),
  body('studentIds.*').isMongoId().withMessage('Invalid student identifier'),
  body('mentorId').optional({ nullable: true, checkFalsy: true }).isMongoId().withMessage('Invalid mentor identifier'),
];

export const academicRules = [
  body('semester').isInt({ min: 1, max: 10 }).withMessage('Semester must be between 1 and 10'),
  body('subjectCode').trim().notEmpty().withMessage('Subject code is required'),
  body('subjectName').trim().notEmpty().withMessage('Subject name is required'),
  body('examType').isIn(EXAM_TYPES).withMessage('Invalid exam type'),
  body('marksObtained').isFloat({ min: 0 }).withMessage('Marks obtained must be 0 or greater'),
  body('maxMarks').isFloat({ min: 1 }).withMessage('Maximum marks must be at least 1'),
];

export const attendanceRules = [
  body('date').isISO8601().withMessage('A valid date is required'),
  body('subjectCode').trim().notEmpty().withMessage('Subject code is required'),
  body('subjectName').trim().notEmpty().withMessage('Subject name is required'),
  body('semester').isInt({ min: 1, max: 10 }).withMessage('Semester must be between 1 and 10'),
  body('status').isIn(ATTENDANCE_STATUS).withMessage('Invalid attendance status'),
  body('periods').optional().isInt({ min: 1, max: 10 }).withMessage('Periods must be 1-10'),
];

export const sessionRules = [
  body('sessionDate').isISO8601().withMessage('A valid session date is required'),
  body('sessionType').isIn(SESSION_TYPES).withMessage('Invalid session type'),
  body('title').trim().isLength({ min: 3, max: 140 }).withMessage('Title must be 3-140 characters'),
  body('issueDiscussed').trim().isLength({ min: 3 }).withMessage('Issue discussed is required'),
  body('mode').optional().isIn(SESSION_MODES).withMessage('Invalid mode'),
  body('status').optional().isIn(SESSION_STATUS).withMessage('Invalid status'),
  body('priority').optional().isIn(PRIORITIES).withMessage('Invalid priority'),
  body('durationMinutes').optional().isInt({ min: 5, max: 480 }).withMessage('Duration must be 5-480 minutes'),
];

export const remarkRules = [
  body('category').isIn(REMARK_CATEGORIES).withMessage('Invalid category'),
  body('remark').trim().isLength({ min: 3, max: 1000 }).withMessage('Remark must be 3-1000 characters'),
  body('rating').optional().isInt({ min: 1, max: 5 }).withMessage('Rating must be 1-5'),
  body('sentiment').optional().isIn(['positive', 'neutral', 'negative']).withMessage('Invalid sentiment'),
];

export const interventionRules = [
  body('interventionType').isIn(INTERVENTION_TYPES).withMessage('Invalid intervention type'),
  body('title').trim().isLength({ min: 3, max: 140 }).withMessage('Title must be 3-140 characters'),
  body('reason').trim().isLength({ min: 3 }).withMessage('Reason is required'),
  body('priority').optional().isIn(PRIORITIES).withMessage('Invalid priority'),
  body('status').optional().isIn(INTERVENTION_STATUS).withMessage('Invalid status'),
  body('startDate').optional().isISO8601().withMessage('A valid start date is required'),
];

export const subjectRules = [
  body('subjectCode').trim().notEmpty().withMessage('Subject code is required'),
  body('subjectName').trim().notEmpty().withMessage('Subject name is required'),
  body('department').trim().notEmpty().withMessage('Department is required'),
  body('year').isInt({ min: 1, max: 5 }).withMessage('Year must be between 1 and 5'),
  body('semester').isInt({ min: 1, max: 10 }).withMessage('Semester must be between 1 and 10'),
  body('section').optional().trim().notEmpty().withMessage('Section is required'),
  body('credits').optional().isFloat({ min: 0 }).withMessage('Credits must be 0 or more'),
  body('mentor').optional({ nullable: true, checkFalsy: true }).isMongoId().withMessage('Invalid mentor identifier'),
];

export const marksSaveRules = [
  body('examType').isIn(EXAM_TYPES).withMessage('Invalid exam type'),
  body('maxMarks').isFloat({ min: 1 }).withMessage('Maximum marks must be at least 1'),
  body('entries').isArray({ min: 1 }).withMessage('No marks to save'),
  body('entries.*.studentId').isMongoId().withMessage('Invalid student identifier'),
];

export const claimRules = [
  body('studentIds').isArray({ min: 1 }).withMessage('Select at least one student'),
  body('studentIds.*').isMongoId().withMessage('Invalid student identifier'),
];
