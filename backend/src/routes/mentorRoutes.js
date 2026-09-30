import express from 'express';
import {
  listMentors, getMentor, createMentor, updateMentor, deleteMentor,
  getMyStudents, getMyMentorProfile, updateMentorStatus,
  getAvailableStudents, claimStudents, releaseStudents,
} from '../controllers/mentorController.js';
import { protect, authorize } from '../middleware/auth.js';
import validate from '../middleware/validate.js';
import { mentorCreateRules, mentorUpdateRules, accountStatusRules, claimRules, objectId } from '../middleware/validators.js';
import { ROLES } from '../config/constants.js';

const router = express.Router();
router.use(protect);

router.get('/me', authorize(ROLES.MENTOR), getMyMentorProfile);
router.get('/me/students', authorize(ROLES.MENTOR), getMyStudents);

router.get('/me/available-students', authorize(ROLES.MENTOR), getAvailableStudents);
router.post('/me/claim', authorize(ROLES.MENTOR), claimRules, validate, claimStudents);
router.post('/me/release', authorize(ROLES.MENTOR), claimRules, validate, releaseStudents);

router.get('/', authorize(ROLES.ADMIN, ROLES.MENTOR), listMentors);
router.post('/', authorize(ROLES.ADMIN), mentorCreateRules, validate, createMentor);

router.get('/:id', objectId('id'), validate, authorize(ROLES.ADMIN), getMentor);
router.put('/:id', objectId('id'), authorize(ROLES.ADMIN), mentorUpdateRules, validate, updateMentor);
router.delete('/:id', objectId('id'), validate, authorize(ROLES.ADMIN), deleteMentor);
router.patch('/:id/status', objectId('id'), authorize(ROLES.ADMIN), accountStatusRules, validate, updateMentorStatus);

export default router;
