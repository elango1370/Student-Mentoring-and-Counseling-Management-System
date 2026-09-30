import express from 'express';
import {
  listStudents, getStudent, createStudent, updateStudent, deleteStudent,
  assignMentor, getStudentOverview, getMyProfile, getDepartments,
} from '../controllers/studentController.js';
import { protect, authorize } from '../middleware/auth.js';
import { resolveStudentAccess } from '../middleware/access.js';
import validate from '../middleware/validate.js';
import { studentCreateRules, studentUpdateRules, assignRules, objectId } from '../middleware/validators.js';
import { ROLES } from '../config/constants.js';

const router = express.Router();
router.use(protect);

router.get('/departments', getDepartments);
router.get('/me', authorize(ROLES.STUDENT), getMyProfile);

router.post('/assign', authorize(ROLES.ADMIN), assignRules, validate, assignMentor);

router.get('/', authorize(ROLES.ADMIN, ROLES.MENTOR), listStudents);
router.post('/', authorize(ROLES.ADMIN), studentCreateRules, validate, createStudent);

router.get('/:studentId/overview', objectId('studentId'), validate, resolveStudentAccess, getStudentOverview);

router.get('/:id', objectId('id'), validate, authorize(ROLES.ADMIN, ROLES.MENTOR), resolveStudentAccess, getStudent);
router.put('/:id', objectId('id'), authorize(ROLES.ADMIN), studentUpdateRules, validate, updateStudent);
router.delete('/:id', objectId('id'), validate, authorize(ROLES.ADMIN), deleteStudent);

export default router;
