import express from 'express';
import authRoutes from './authRoutes.js';
import studentRoutes from './studentRoutes.js';
import mentorRoutes from './mentorRoutes.js';
import dashboardRoutes from './dashboardRoutes.js';
import recordRoutes from './recordRoutes.js';
import adminRoutes from './adminRoutes.js';
import subjectRoutes from './subjectRoutes.js';
import Student from '../models/Student.js';
import Mentor from '../models/Mentor.js';
import asyncHandler from '../utils/asyncHandler.js';
import { SESSION_TYPES, SESSION_STATUS, SESSION_MODES, EXAM_TYPES, ATTENDANCE_STATUS, REMARK_CATEGORIES, INTERVENTION_TYPES, INTERVENTION_STATUS, PRIORITIES } from '../config/constants.js';

const router = express.Router();

router.get('/health', (req, res) => {
  res.status(200).json({ success: true, status: 'ok', timestamp: new Date().toISOString() });
});

router.get('/meta', (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      examTypes: EXAM_TYPES,
      attendanceStatus: ATTENDANCE_STATUS,
      sessionTypes: SESSION_TYPES,
      sessionStatus: SESSION_STATUS,
      sessionModes: SESSION_MODES,
      remarkCategories: REMARK_CATEGORIES,
      interventionTypes: INTERVENTION_TYPES,
      interventionStatus: INTERVENTION_STATUS,
      priorities: PRIORITIES,
    },
  });
});

// Public list used by the sign-up form before a session exists.
router.get('/departments', asyncHandler(async (req, res) => {
  const [studentDepts, mentorDepts] = await Promise.all([
    Student.distinct('department'),
    Mentor.distinct('department'),
  ]);
  const data = Array.from(new Set([...studentDepts, ...mentorDepts].filter(Boolean))).sort();
  res.status(200).json({ success: true, data });
}));

router.use('/auth', authRoutes);
router.use('/students', studentRoutes);
router.use('/students/:studentId', recordRoutes);
router.use('/mentors', mentorRoutes);
router.use('/admin', adminRoutes);
router.use('/subjects', subjectRoutes);
router.use('/dashboard', dashboardRoutes);

export default router;
