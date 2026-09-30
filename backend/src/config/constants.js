export const ROLES = {
  ADMIN: 'admin',
  MENTOR: 'mentor',
  STUDENT: 'student',
};

export const ACCOUNT_STATUS = {
  PENDING: 'pending',
  ACTIVE: 'active',
  SUSPENDED: 'suspended',
};
export const ACCOUNT_STATUSES = Object.values(ACCOUNT_STATUS);

export const EXAM_TYPES = ['Internal 1', 'Internal 2', 'Internal 3', 'Model', 'Semester', 'Assignment'];
export const ATTENDANCE_STATUS = ['present', 'absent', 'late', 'excused'];
export const SESSION_TYPES = ['academic', 'personal', 'career', 'behavioural', 'attendance', 'other'];
export const SESSION_STATUS = ['scheduled', 'completed', 'cancelled'];
export const SESSION_MODES = ['in-person', 'online', 'phone'];
export const REMARK_CATEGORIES = ['academic', 'behaviour', 'attendance', 'achievement', 'concern', 'general'];
export const INTERVENTION_TYPES = [
  'academic-support',
  'attendance-warning',
  'parent-meeting',
  'counseling-referral',
  'disciplinary',
  'remedial-class',
  'peer-mentoring',
  'other',
];
export const INTERVENTION_STATUS = ['planned', 'in-progress', 'completed', 'escalated', 'closed'];
export const PRIORITIES = ['low', 'medium', 'high', 'critical'];
