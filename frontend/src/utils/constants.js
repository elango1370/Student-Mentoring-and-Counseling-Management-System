export const EXAM_TYPES = ['Internal 1', 'Internal 2', 'Internal 3', 'Model', 'Semester', 'Assignment'];
export const ATTENDANCE_STATUS = ['present', 'absent', 'late', 'excused'];
export const SESSION_TYPES = ['academic', 'personal', 'career', 'behavioural', 'attendance', 'other'];
export const SESSION_STATUS = ['scheduled', 'completed', 'cancelled'];
export const SESSION_MODES = ['in-person', 'online', 'phone'];
export const REMARK_CATEGORIES = ['academic', 'behaviour', 'attendance', 'achievement', 'concern', 'general'];
export const SENTIMENTS = ['positive', 'neutral', 'negative'];
export const INTERVENTION_TYPES = [
  'academic-support', 'attendance-warning', 'parent-meeting', 'counseling-referral',
  'disciplinary', 'remedial-class', 'peer-mentoring', 'other',
];
export const INTERVENTION_STATUS = ['planned', 'in-progress', 'completed', 'escalated', 'closed'];
export const PRIORITIES = ['low', 'medium', 'high', 'critical'];
export const YEARS = [1, 2, 3, 4, 5];
export const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

export const TONES = {
  present: 'bg-emerald-100 text-emerald-700',
  absent: 'bg-red-100 text-red-700',
  late: 'bg-amber-100 text-amber-700',
  excused: 'bg-sky-100 text-sky-700',
  completed: 'bg-emerald-100 text-emerald-700',
  scheduled: 'bg-sky-100 text-sky-700',
  cancelled: 'bg-ink-200 text-ink-600',
  planned: 'bg-sky-100 text-sky-700',
  'in-progress': 'bg-amber-100 text-amber-700',
  escalated: 'bg-red-100 text-red-700',
  closed: 'bg-ink-200 text-ink-600',
  low: 'bg-emerald-100 text-emerald-700',
  medium: 'bg-amber-100 text-amber-700',
  high: 'bg-orange-100 text-orange-700',
  critical: 'bg-red-100 text-red-700',
  positive: 'bg-emerald-100 text-emerald-700',
  neutral: 'bg-ink-200 text-ink-600',
  negative: 'bg-red-100 text-red-700',
  active: 'bg-emerald-100 text-emerald-700',
  inactive: 'bg-ink-200 text-ink-600',
  graduated: 'bg-brand-100 text-brand-700',
  pending: 'bg-amber-100 text-amber-700',
  suspended: 'bg-red-100 text-red-700',
  good: 'bg-emerald-100 text-emerald-700',
  warning: 'bg-amber-100 text-amber-700',
};

export const ACCOUNT_STATUSES = ['pending', 'active', 'suspended'];

export const CHART_COLORS = ['#4f46e5', '#0891b2', '#059669', '#d97706', '#dc2626', '#7c3aed', '#db2777', '#0ea5e9'];
