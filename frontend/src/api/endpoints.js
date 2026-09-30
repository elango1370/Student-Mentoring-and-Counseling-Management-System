import client from './client.js';

const unwrap = (promise) => promise.then((res) => res.data);

export const authApi = {
  register: (payload) => unwrap(client.post('/auth/register', payload)),
  login: (payload) => unwrap(client.post('/auth/login', payload)),
  logout: () => unwrap(client.post('/auth/logout')),
  logoutAll: () => unwrap(client.post('/auth/logout-all')),
  me: () => unwrap(client.get('/auth/me')),
  updateProfile: (payload) => unwrap(client.patch('/auth/me', payload)),
  changePassword: (payload) => unwrap(client.patch('/auth/change-password', payload)),
  verifyEmail: (payload) => unwrap(client.post('/auth/verify-email', payload)),
  resendVerification: (payload) => unwrap(client.post('/auth/resend-verification', payload)),
  forgotPassword: (payload) => unwrap(client.post('/auth/forgot-password', payload)),
  resetPassword: (payload) => unwrap(client.post('/auth/reset-password', payload)),
};

export const metaApi = {
  get: () => unwrap(client.get('/meta')),
  departments: () => unwrap(client.get('/students/departments')),
  publicDepartments: () => unwrap(client.get('/departments')),
};

export const dashboardApi = {
  get: () => unwrap(client.get('/dashboard')),
};

export const studentApi = {
  list: (params) => unwrap(client.get('/students', { params })),
  get: (id) => unwrap(client.get(`/students/${id}`)),
  create: (payload) => unwrap(client.post('/students', payload)),
  update: (id, payload) => unwrap(client.put(`/students/${id}`, payload)),
  remove: (id) => unwrap(client.delete(`/students/${id}`)),
  assign: (payload) => unwrap(client.post('/students/assign', payload)),
  overview: (id) => unwrap(client.get(`/students/${id}/overview`)),
  me: () => unwrap(client.get('/students/me')),
};

export const adminApi = {
  listAdmins: () => unwrap(client.get('/admin/users')),
  createAdmin: (payload) => unwrap(client.post('/admin/users', payload)),
  updateAdminStatus: (id, status) => unwrap(client.patch(`/admin/users/${id}/status`, { status })),
};

export const mentorApi = {
  list: (params) => unwrap(client.get('/mentors', { params })),
  get: (id) => unwrap(client.get(`/mentors/${id}`)),
  create: (payload) => unwrap(client.post('/mentors', payload)),
  update: (id, payload) => unwrap(client.put(`/mentors/${id}`, payload)),
  remove: (id) => unwrap(client.delete(`/mentors/${id}`)),
  myStudents: (params) => unwrap(client.get('/mentors/me/students', { params })),
  myProfile: () => unwrap(client.get('/mentors/me')),
  updateStatus: (id, status) => unwrap(client.patch(`/mentors/${id}/status`, { status })),
  availableStudents: (params) => unwrap(client.get('/mentors/me/available-students', { params })),
  claimStudents: (studentIds) => unwrap(client.post('/mentors/me/claim', { studentIds })),
  releaseStudents: (studentIds) => unwrap(client.post('/mentors/me/release', { studentIds })),
};

export const subjectApi = {
  list: (params) => unwrap(client.get('/subjects', { params })),
  create: (payload) => unwrap(client.post('/subjects', payload)),
  update: (id, payload) => unwrap(client.put(`/subjects/${id}`, payload)),
  remove: (id) => unwrap(client.delete(`/subjects/${id}`)),
  getMarks: (id, examType) => unwrap(client.get(`/subjects/${id}/marks`, { params: { examType } })),
  saveMarks: (id, payload) => unwrap(client.put(`/subjects/${id}/marks`, payload)),
};

const recordResource = (segment) => ({
  list: (studentId, params) => unwrap(client.get(`/students/${studentId}/${segment}`, { params })),
  create: (studentId, payload) => unwrap(client.post(`/students/${studentId}/${segment}`, payload)),
  update: (studentId, recordId, payload) => unwrap(client.put(`/students/${studentId}/${segment}/${recordId}`, payload)),
  remove: (studentId, recordId) => unwrap(client.delete(`/students/${studentId}/${segment}/${recordId}`)),
});

export const academicApi = recordResource('academics');
export const attendanceApi = recordResource('attendance');
export const sessionApi = recordResource('sessions');
export const remarkApi = recordResource('remarks');
export const interventionApi = recordResource('interventions');
