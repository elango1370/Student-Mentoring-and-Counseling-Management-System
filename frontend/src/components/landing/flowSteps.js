// Single source of truth for the data-flow section: the HTML list and the 3D scene both read this.
export const FLOW_STEPS = [
  { id: 'mentor', label: 'Mentor', text: 'A faculty member owns the mentoring relationship.', color: '#60a5fa' },
  { id: 'students', label: 'Students', text: 'Each mentor is assigned a group of students.', color: '#38bdf8' },
  { id: 'academic', label: 'Academic Progress', text: 'Marks from every exam feed into one performance view.', color: '#22d3ee' },
  { id: 'attendance', label: 'Attendance', text: 'Attendance percentages flag students falling behind.', color: '#2dd4bf' },
  { id: 'counseling', label: 'Counseling', text: 'Sessions are recorded with the issue and the follow-up.', color: '#a78bfa' },
  { id: 'intervention', label: 'Intervention', text: 'Support actions are tracked until the concern is closed.', color: '#fbbf24' },
];
