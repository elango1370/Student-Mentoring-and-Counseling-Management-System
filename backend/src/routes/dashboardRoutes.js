import express from 'express';
import { getDashboard, getSystemUsers } from '../controllers/dashboardController.js';
import { protect, authorize } from '../middleware/auth.js';
import { ROLES } from '../config/constants.js';

const router = express.Router();
router.use(protect);

router.get('/', getDashboard);
router.get('/users', authorize(ROLES.ADMIN), getSystemUsers);

export default router;
