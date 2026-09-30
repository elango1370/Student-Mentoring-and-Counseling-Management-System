import express from 'express';
import {
  listSubjects, createSubject, updateSubject, deleteSubject, getSubjectMarks, saveSubjectMarks,
} from '../controllers/subjectController.js';
import { protect, authorize } from '../middleware/auth.js';
import validate from '../middleware/validate.js';
import { subjectRules, marksSaveRules, objectId } from '../middleware/validators.js';
import { ROLES } from '../config/constants.js';

const router = express.Router();
router.use(protect, authorize(ROLES.ADMIN, ROLES.MENTOR));

router.route('/')
  .get(listSubjects)
  .post(subjectRules, validate, createSubject);
router.route('/:id')
  .put(objectId('id'), validate, updateSubject)
  .delete(objectId('id'), validate, deleteSubject);
router.route('/:id/marks')
  .get(objectId('id'), validate, getSubjectMarks)
  .put(objectId('id'), marksSaveRules, validate, saveSubjectMarks);

export default router;
