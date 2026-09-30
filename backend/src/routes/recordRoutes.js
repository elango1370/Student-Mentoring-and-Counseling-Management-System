import express from 'express';
import {
  listAcademicRecords, createAcademicRecord, updateAcademicRecord, deleteAcademicRecord,
} from '../controllers/academicController.js';
import {
  listAttendance, createAttendance, updateAttendance, deleteAttendance,
} from '../controllers/attendanceController.js';
import {
  listSessions, createSession, updateSession, deleteSession,
} from '../controllers/counselingController.js';
import {
  listRemarks, createRemark, updateRemark, deleteRemark,
} from '../controllers/remarkController.js';
import {
  listInterventions, createIntervention, updateIntervention, deleteIntervention,
} from '../controllers/interventionController.js';
import { protect, authorize } from '../middleware/auth.js';
import { resolveStudentAccess, resolveAcademicAccess } from '../middleware/access.js';
import validate from '../middleware/validate.js';
import {
  academicRules, attendanceRules, sessionRules, remarkRules, interventionRules, objectId,
} from '../middleware/validators.js';
import { ROLES } from '../config/constants.js';

// Mounted at /api/students/:studentId
const router = express.Router({ mergeParams: true });

router.use(protect);
router.use(objectId('studentId'), validate);
// Marks have their own, subject-aware access rules; everything else stays mentee-based.
router.use('/academics', resolveAcademicAccess);
router.use(['/attendance', '/sessions', '/remarks', '/interventions'], resolveStudentAccess);

const staff = authorize(ROLES.ADMIN, ROLES.MENTOR);
const mentorOnly = authorize(ROLES.MENTOR);

router.route('/academics')
  .get(listAcademicRecords)
  .post(staff, academicRules, validate, createAcademicRecord);
router.route('/academics/:recordId')
  .put(staff, objectId('recordId'), validate, updateAcademicRecord)
  .delete(staff, objectId('recordId'), validate, deleteAcademicRecord);

router.route('/attendance')
  .get(listAttendance)
  .post(staff, attendanceRules, validate, createAttendance);
router.route('/attendance/:recordId')
  .put(staff, objectId('recordId'), validate, updateAttendance)
  .delete(staff, objectId('recordId'), validate, deleteAttendance);

router.route('/sessions')
  .get(listSessions)
  .post(mentorOnly, sessionRules, validate, createSession);
router.route('/sessions/:recordId')
  .put(staff, objectId('recordId'), validate, updateSession)
  .delete(staff, objectId('recordId'), validate, deleteSession);

router.route('/remarks')
  .get(listRemarks)
  .post(mentorOnly, remarkRules, validate, createRemark);
router.route('/remarks/:recordId')
  .put(staff, objectId('recordId'), validate, updateRemark)
  .delete(staff, objectId('recordId'), validate, deleteRemark);

router.route('/interventions')
  .get(listInterventions)
  .post(mentorOnly, interventionRules, validate, createIntervention);
router.route('/interventions/:recordId')
  .put(staff, objectId('recordId'), validate, updateIntervention)
  .delete(staff, objectId('recordId'), validate, deleteIntervention);

export default router;
