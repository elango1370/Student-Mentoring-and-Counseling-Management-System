import express from 'express';
import { listAdmins, createAdmin, updateAdminStatus } from '../controllers/adminController.js';
import { protect, authorize } from '../middleware/auth.js';
import validate from '../middleware/validate.js';
import { adminCreateRules, accountStatusRules, objectId } from '../middleware/validators.js';
import { ROLES } from '../config/constants.js';

// Every route here requires an authenticated administrator. There is no
// public path that reaches this router — it is the only way an additional
// admin account can ever be created.
const router = express.Router();
router.use(protect, authorize(ROLES.ADMIN));

router.get('/users', listAdmins);
router.post('/users', adminCreateRules, validate, createAdmin);
router.patch('/users/:id/status', objectId('id'), accountStatusRules, validate, updateAdminStatus);

export default router;
