import mongoose from 'mongoose';
import User from '../models/User.js';
import Student from '../models/Student.js';
import Mentor from '../models/Mentor.js';
import AcademicRecord from '../models/AcademicRecord.js';
import Attendance from '../models/Attendance.js';
import CounselingSession from '../models/CounselingSession.js';
import MentorRemark from '../models/MentorRemark.js';
import Intervention from '../models/Intervention.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { ROLES, ACCOUNT_STATUS } from '../config/constants.js';
import { computeAttendanceStats, groupAttendanceBySubject, monthlyAttendanceTrend } from '../utils/attendance.js';

const PALETTE = ['#4f46e5', '#0891b2', '#059669', '#d97706', '#dc2626', '#7c3aed', '#db2777'];
const pickColor = () => PALETTE[Math.floor(Math.random() * PALETTE.length)];

export const listStudents = asyncHandler(async (req, res) => {
  const { search = '', department = '', year = '', section = '', semester = '', mentor = '', status = '', unassigned = '', page = 1, limit = 12 } = req.query;

  const filter = {};
  if (department) filter.department = department;
  if (year) filter.year = Number(year);
  if (section) filter.section = String(section).toUpperCase();
  if (semester) filter.semester = Number(semester);
  if (status) filter.status = status;
  if (unassigned === 'true') filter.mentor = null;

  if (req.user.role === ROLES.MENTOR) {
    if (!req.mentorProfile) throw new ApiError(403, 'Mentor profile not found.');
    filter.mentor = req.mentorProfile._id;
  } else if (mentor) {
    filter.mentor = mongoose.isValidObjectId(mentor) ? mentor : null;
  }

  if (search) {
    const rx = new RegExp(search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    const matchedUsers = await User.find({ role: ROLES.STUDENT, $or: [{ name: rx }, { email: rx }] }).select('_id');
    filter.$or = [{ rollNumber: rx }, { registerNumber: rx }, { user: { $in: matchedUsers.map((u) => u._id) } }];
  }

  const pageNum = Math.max(1, Number(page));
  const perPage = Math.min(100, Math.max(1, Number(limit)));

  const [items, total] = await Promise.all([
    Student.find(filter)
      .populate('user', 'name email phone avatarColor isActive status lastLogin')
      .populate({ path: 'mentor', select: 'employeeId department user', populate: { path: 'user', select: 'name email' } })
      .sort({ rollNumber: 1 })
      .skip((pageNum - 1) * perPage)
      .limit(perPage),
    Student.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    data: items,
    pagination: { page: pageNum, limit: perPage, total, pages: Math.ceil(total / perPage) || 1 },
  });
});

export const getStudent = asyncHandler(async (req, res) => {
  const student = await Student.findById(req.params.id)
    .populate('user', 'name email phone avatarColor isActive status lastLogin createdAt')
    .populate({ path: 'mentor', select: 'employeeId department designation user', populate: { path: 'user', select: 'name email phone' } });

  if (!student) throw new ApiError(404, 'Student not found.');
  res.status(200).json({ success: true, data: student });
});

export const createStudent = asyncHandler(async (req, res) => {
  const {
    name, email, password, phone, rollNumber, registerNumber, department, program, year, semester,
    section, dateOfBirth, gender, bloodGroup, address, guardianName, guardianPhone, hostelResident,
    admissionYear, mentor,
  } = req.body;

  const existing = await User.findOne({ email: String(email).toLowerCase() });
  if (existing) throw new ApiError(409, 'A user with this email already exists.');

  const rollExists = await Student.findOne({ rollNumber: String(rollNumber).toUpperCase() });
  if (rollExists) throw new ApiError(409, 'A student with this roll number already exists.');

  if (mentor) {
    const mentorDoc = await Mentor.findById(mentor);
    if (!mentorDoc) throw new ApiError(404, 'Selected mentor does not exist.');
  }

  const user = await User.create({
    name, email, password, phone: phone || '', role: ROLES.STUDENT, avatarColor: pickColor(),
    status: ACCOUNT_STATUS.ACTIVE,
    emailVerifiedAt: new Date(),
  });

  try {
    const student = await Student.create({
      user: user._id, rollNumber, registerNumber: registerNumber || '', department, program: program || 'B.E.',
      year, semester, section: section || 'A', dateOfBirth: dateOfBirth || null, gender: gender || '',
      bloodGroup: bloodGroup || '', address: address || '', guardianName: guardianName || '',
      guardianPhone: guardianPhone || '', hostelResident: Boolean(hostelResident),
      admissionYear: admissionYear || new Date().getFullYear(), mentor: mentor || null,
    });

    const populated = await Student.findById(student._id)
      .populate('user', 'name email phone avatarColor isActive status')
      .populate({ path: 'mentor', select: 'employeeId department user', populate: { path: 'user', select: 'name' } });

    res.status(201).json({ success: true, message: 'Student created successfully', data: populated });
  } catch (err) {
    await User.findByIdAndDelete(user._id);
    throw err;
  }
});

export const updateStudent = asyncHandler(async (req, res) => {
  const student = await Student.findById(req.params.id);
  if (!student) throw new ApiError(404, 'Student not found.');

  const { name, email, phone, isActive, password, ...studentFields } = req.body;

  const user = await User.findById(student.user);
  if (user) {
    if (name) user.name = name;
    if (email && email.toLowerCase() !== user.email) {
      const taken = await User.findOne({ email: email.toLowerCase(), _id: { $ne: user._id } });
      if (taken) throw new ApiError(409, 'That email is already in use.');
      user.email = email;
    }
    if (phone !== undefined) user.phone = phone;
    if (isActive !== undefined) {
      user.isActive = Boolean(isActive);
      user.status = user.isActive ? ACCOUNT_STATUS.ACTIVE : ACCOUNT_STATUS.SUSPENDED;
    }
    if (password) user.password = password;
    await user.save();
  }

  const allowed = [
    'rollNumber', 'registerNumber', 'department', 'program', 'year', 'semester', 'section',
    'dateOfBirth', 'gender', 'bloodGroup', 'address', 'guardianName', 'guardianPhone',
    'hostelResident', 'admissionYear', 'mentor', 'status',
  ];
  allowed.forEach((key) => {
    if (studentFields[key] !== undefined) {
      student[key] = studentFields[key] === '' && key === 'mentor' ? null : studentFields[key];
    }
  });

  await student.save();

  const populated = await Student.findById(student._id)
    .populate('user', 'name email phone avatarColor isActive status')
    .populate({ path: 'mentor', select: 'employeeId department user', populate: { path: 'user', select: 'name' } });

  res.status(200).json({ success: true, message: 'Student updated successfully', data: populated });
});

export const deleteStudent = asyncHandler(async (req, res) => {
  const student = await Student.findById(req.params.id);
  if (!student) throw new ApiError(404, 'Student not found.');

  await Promise.all([
    AcademicRecord.deleteMany({ student: student._id }),
    Attendance.deleteMany({ student: student._id }),
    CounselingSession.deleteMany({ student: student._id }),
    MentorRemark.deleteMany({ student: student._id }),
    Intervention.deleteMany({ student: student._id }),
  ]);

  await User.findByIdAndDelete(student.user);
  await student.deleteOne();

  res.status(200).json({ success: true, message: 'Student and all related records deleted.' });
});

export const assignMentor = asyncHandler(async (req, res) => {
  const { studentIds, mentorId } = req.body;

  if (!Array.isArray(studentIds) || studentIds.length === 0) {
    throw new ApiError(400, 'Select at least one student to assign.');
  }

  let mentorDoc = null;
  if (mentorId) {
    mentorDoc = await Mentor.findById(mentorId);
    if (!mentorDoc) throw new ApiError(404, 'Mentor not found.');

    const currentCount = await Student.countDocuments({ mentor: mentorId, _id: { $nin: studentIds } });
    if (currentCount + studentIds.length > mentorDoc.maxStudents) {
      throw new ApiError(400, `This mentor can take at most ${mentorDoc.maxStudents} students (currently ${currentCount}).`);
    }
  }

  const result = await Student.updateMany(
    { _id: { $in: studentIds } },
    { $set: { mentor: mentorId || null } }
  );

  res.status(200).json({
    success: true,
    message: mentorId
      ? `${result.modifiedCount} student(s) assigned successfully.`
      : `${result.modifiedCount} student(s) unassigned.`,
  });
});

export const getStudentOverview = asyncHandler(async (req, res) => {
  const student = req.targetStudent;

  const [academics, attendance, sessions, remarks, interventions] = await Promise.all([
    AcademicRecord.find({ student: student._id }).sort({ examDate: -1 }),
    Attendance.find({ student: student._id }).sort({ date: -1 }),
    CounselingSession.find({ student: student._id }).sort({ sessionDate: -1 }).limit(5)
      .populate({ path: 'mentor', select: 'user', populate: { path: 'user', select: 'name' } }),
    MentorRemark.find({ student: student._id }).sort({ remarkDate: -1 }).limit(5)
      .populate({ path: 'mentor', select: 'user', populate: { path: 'user', select: 'name' } }),
    Intervention.find({ student: student._id }).sort({ startDate: -1 }),
  ]);

  const totalMarks = academics.reduce((s, r) => s + r.marksObtained, 0);
  const totalMax = academics.reduce((s, r) => s + r.maxMarks, 0);
  const averagePercentage = totalMax > 0 ? Number(((totalMarks / totalMax) * 100).toFixed(2)) : 0;
  const failedCount = academics.filter((r) => (r.marksObtained / r.maxMarks) * 100 < 40).length;

  const semesterMap = new Map();
  academics.forEach((r) => {
    if (!semesterMap.has(r.semester)) semesterMap.set(r.semester, { obtained: 0, max: 0 });
    const e = semesterMap.get(r.semester);
    e.obtained += r.marksObtained;
    e.max += r.maxMarks;
  });
  const semesterPerformance = Array.from(semesterMap.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([semester, e]) => ({
      semester,
      label: `Sem ${semester}`,
      percentage: e.max ? Number(((e.obtained / e.max) * 100).toFixed(2)) : 0,
    }));

  const attendanceStats = computeAttendanceStats(attendance);

  const riskFactors = [];
  if (attendanceStats.percentage < 75 && attendanceStats.totalPeriods > 0) riskFactors.push('Attendance below 75%');
  if (averagePercentage < 50 && academics.length > 0) riskFactors.push('Average marks below 50%');
  if (failedCount > 0) riskFactors.push(`${failedCount} failing assessment(s)`);
  if (interventions.filter((i) => ['planned', 'in-progress', 'escalated'].includes(i.status)).length > 0) {
    riskFactors.push('Open interventions');
  }
  const riskLevel = riskFactors.length >= 3 ? 'high' : riskFactors.length >= 1 ? 'medium' : 'low';

  res.status(200).json({
    success: true,
    data: {
      student,
      academics: {
        totalRecords: academics.length,
        averagePercentage,
        failedCount,
        semesterPerformance,
        subjectBreakdown: academics.slice(0, 10).map((r) => ({
          id: r._id, subjectCode: r.subjectCode, subjectName: r.subjectName,
          examType: r.examType, marksObtained: r.marksObtained, maxMarks: r.maxMarks,
          percentage: r.percentage, grade: r.grade, examDate: r.examDate,
        })),
      },
      attendance: {
        ...attendanceStats,
        bySubject: groupAttendanceBySubject(attendance),
        trend: monthlyAttendanceTrend(attendance),
      },
      counseling: { total: await CounselingSession.countDocuments({ student: student._id }), recent: sessions },
      remarks: { total: await MentorRemark.countDocuments({ student: student._id }), recent: remarks },
      interventions: {
        total: interventions.length,
        open: interventions.filter((i) => ['planned', 'in-progress', 'escalated'].includes(i.status)).length,
        recent: interventions.slice(0, 5),
      },
      risk: { level: riskLevel, factors: riskFactors },
    },
  });
});

export const getMyProfile = asyncHandler(async (req, res) => {
  if (!req.studentProfile) throw new ApiError(404, 'Student profile not found.');
  const student = await Student.findById(req.studentProfile._id)
    .populate('user', 'name email phone avatarColor lastLogin createdAt')
    .populate({ path: 'mentor', select: 'employeeId department designation officeLocation user', populate: { path: 'user', select: 'name email phone' } });
  res.status(200).json({ success: true, data: student });
});

export const getDepartments = asyncHandler(async (req, res) => {
  const [studentDepts, mentorDepts] = await Promise.all([
    Student.distinct('department'),
    Mentor.distinct('department'),
  ]);
  const departments = Array.from(new Set([...studentDepts, ...mentorDepts])).filter(Boolean).sort();
  res.status(200).json({ success: true, data: departments });
});
