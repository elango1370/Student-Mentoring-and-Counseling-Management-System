import Student from '../models/Student.js';
import SubjectAllocation from '../models/SubjectAllocation.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { ROLES } from '../config/constants.js';

/**
 * Resolves the target student from :studentId (or req.body.student) and verifies
 * the requester may access it. Admins see everyone, mentors see only assigned
 * students, students see only themselves. Attaches req.targetStudent.
 */
export const resolveStudentAccess = asyncHandler(async (req, res, next) => {
  const studentId = req.params.studentId || req.params.id || req.body.student;
  if (!studentId) throw new ApiError(400, 'A student identifier is required.');

  const student = await Student.findById(studentId).populate('user', 'name email phone avatarColor isActive status');
  if (!student) throw new ApiError(404, 'Student not found.');

  if (req.user.role === ROLES.ADMIN) {
    req.targetStudent = student;
    return next();
  }

  if (req.user.role === ROLES.MENTOR) {
    if (!req.mentorProfile) throw new ApiError(403, 'Mentor profile not found.');
    if (String(student.mentor) !== String(req.mentorProfile._id)) {
      throw new ApiError(403, 'This student is not assigned to you.');
    }
    req.targetStudent = student;
    return next();
  }

  if (req.user.role === ROLES.STUDENT) {
    if (!req.studentProfile || String(req.studentProfile._id) !== String(student._id)) {
      throw new ApiError(403, 'You can only access your own records.');
    }
    req.targetStudent = student;
    return next();
  }

  throw new ApiError(403, 'Access denied.');
});

/**
 * Access rules for academic (marks) records.
 * - admin: everything
 * - student: own records only
 * - mentor: may VIEW all marks of their own mentees, and may EDIT only the
 *   subjects they personally handle (see SubjectAllocation). A mentor who
 *   handles a subject for the student's class but is not their mentor can only
 *   see/edit marks of the subjects they handle.
 * Attaches req.targetStudent and req.academicScope.
 */
export const resolveAcademicAccess = asyncHandler(async (req, res, next) => {
  const studentId = req.params.studentId;
  const student = await Student.findById(studentId).populate('user', 'name email phone avatarColor isActive status');
  if (!student) throw new ApiError(404, 'Student not found.');
  req.targetStudent = student;

  if (req.user.role === ROLES.ADMIN) {
    req.academicScope = { viewAll: true, admin: true, handled: [] };
    return next();
  }

  if (req.user.role === ROLES.STUDENT) {
    if (!req.studentProfile || String(req.studentProfile._id) !== String(student._id)) {
      throw new ApiError(403, 'You can only access your own records.');
    }
    req.academicScope = { viewAll: true, admin: false, handled: [] };
    return next();
  }

  if (req.user.role === ROLES.MENTOR) {
    if (!req.mentorProfile) throw new ApiError(403, 'Mentor profile not found.');
    const handled = await SubjectAllocation.find({
      mentor: req.mentorProfile._id, department: student.department, section: student.section,
    }).select('subjectCode subjectName semester credits').lean();
    const isMentee = String(student.mentor) === String(req.mentorProfile._id);
    if (!isMentee && handled.length === 0) {
      throw new ApiError(403, 'This student is not assigned to you and you do not handle any of their subjects.');
    }
    req.academicScope = { viewAll: isMentee, admin: false, handled };
    return next();
  }

  throw new ApiError(403, 'Access denied.');
});

export const handlesSubject = (scope, subjectCode, semester) =>
  scope.handled.some((h) => h.subjectCode === String(subjectCode).toUpperCase() && Number(h.semester) === Number(semester));
