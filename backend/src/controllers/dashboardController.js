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
import { ROLES } from '../config/constants.js';
import { computeAttendanceStats, groupAttendanceBySubject, monthlyAttendanceTrend } from '../utils/attendance.js';

const monthKey = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

const buildMonthBuckets = (months = 6) => {
  const now = new Date();
  const buckets = [];
  for (let i = months - 1; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    buckets.push({
      month: monthKey(d),
      label: d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
      count: 0,
    });
  }
  return buckets;
};

const bucketise = (docs, dateField, months = 6) => {
  const buckets = buildMonthBuckets(months);
  const index = new Map(buckets.map((b, i) => [b.month, i]));
  docs.forEach((doc) => {
    const key = monthKey(new Date(doc[dateField]));
    if (index.has(key)) buckets[index.get(key)].count += 1;
  });
  return buckets;
};

export const getAdminDashboard = asyncHandler(async (req, res) => {
  const [
    totalStudents, activeStudents, totalMentors, unassignedStudents,
    totalSessions, totalRemarks, totalInterventions, openInterventions,
    departmentAgg, yearAgg, mentorLoad, sessionDocs, interventionDocs, sessionTypeAgg, attendanceDocs, academicDocs, recentSessions, recentInterventions,
  ] = await Promise.all([
    Student.countDocuments(),
    Student.countDocuments({ status: 'active' }),
    Mentor.countDocuments(),
    Student.countDocuments({ mentor: null }),
    CounselingSession.countDocuments(),
    MentorRemark.countDocuments(),
    Intervention.countDocuments(),
    Intervention.countDocuments({ status: { $in: ['planned', 'in-progress', 'escalated'] } }),
    Student.aggregate([{ $group: { _id: '$department', count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
    Student.aggregate([{ $group: { _id: '$year', count: { $sum: 1 } } }, { $sort: { _id: 1 } }]),
    Student.aggregate([
      { $match: { mentor: { $ne: null } } },
      { $group: { _id: '$mentor', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 8 },
      { $lookup: { from: 'mentors', localField: '_id', foreignField: '_id', as: 'mentor' } },
      { $unwind: '$mentor' },
      { $lookup: { from: 'users', localField: 'mentor.user', foreignField: '_id', as: 'user' } },
      { $unwind: '$user' },
      { $project: { _id: 0, mentorId: '$_id', name: '$user.name', department: '$mentor.department', count: 1 } },
    ]),
    CounselingSession.find().select('sessionDate').lean(),
    Intervention.find().select('startDate').lean(),
    CounselingSession.aggregate([{ $group: { _id: '$sessionType', count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
    Attendance.find().select('status periods date').lean(),
    AcademicRecord.find().select('marksObtained maxMarks semester').lean(),
    CounselingSession.find().sort({ createdAt: -1 }).limit(6)
      .populate({ path: 'student', select: 'rollNumber user', populate: { path: 'user', select: 'name avatarColor' } })
      .populate({ path: 'mentor', select: 'user', populate: { path: 'user', select: 'name' } }),
    Intervention.find().sort({ createdAt: -1 }).limit(6)
      .populate({ path: 'student', select: 'rollNumber user', populate: { path: 'user', select: 'name avatarColor' } })
      .populate({ path: 'mentor', select: 'user', populate: { path: 'user', select: 'name' } }),
  ]);

  const totalObtained = academicDocs.reduce((s, r) => s + r.marksObtained, 0);
  const totalMax = academicDocs.reduce((s, r) => s + r.maxMarks, 0);

  const semMap = new Map();
  academicDocs.forEach((r) => {
    if (!semMap.has(r.semester)) semMap.set(r.semester, { obtained: 0, max: 0 });
    const e = semMap.get(r.semester);
    e.obtained += r.marksObtained;
    e.max += r.maxMarks;
  });

  res.status(200).json({
    success: true,
    data: {
      stats: {
        totalStudents,
        activeStudents,
        totalMentors,
        assignedStudents: totalStudents - unassignedStudents,
        unassignedStudents,
        totalSessions,
        totalRemarks,
        totalInterventions,
        openInterventions,
        averageAttendance: computeAttendanceStats(attendanceDocs).percentage,
        averageMarks: totalMax ? Number(((totalObtained / totalMax) * 100).toFixed(2)) : 0,
      },
      charts: {
        byDepartment: departmentAgg.map((d) => ({ label: d._id || 'Unspecified', count: d.count })),
        byYear: yearAgg.map((d) => ({ label: `Year ${d._id}`, count: d.count })),
        mentorLoad,
        sessionsTrend: bucketise(sessionDocs, 'sessionDate'),
        interventionsTrend: bucketise(interventionDocs, 'startDate'),
        sessionTypes: sessionTypeAgg.map((d) => ({ label: d._id, count: d.count })),
        attendanceTrend: monthlyAttendanceTrend(attendanceDocs),
        semesterPerformance: Array.from(semMap.entries())
          .sort((a, b) => a[0] - b[0])
          .map(([semester, e]) => ({
            label: `Sem ${semester}`,
            percentage: e.max ? Number(((e.obtained / e.max) * 100).toFixed(2)) : 0,
          })),
      },
      recent: { sessions: recentSessions, interventions: recentInterventions },
    },
  });
});

export const getMentorDashboard = asyncHandler(async (req, res) => {
  if (!req.mentorProfile) throw new ApiError(403, 'Mentor profile not found.');
  const mentorId = req.mentorProfile._id;

  const students = await Student.find({ mentor: mentorId }).populate('user', 'name avatarColor').lean();
  const studentIds = students.map((s) => s._id);

  const [sessions, interventions, remarks, attendanceDocs, academicDocs, upcomingFollowUps] = await Promise.all([
    CounselingSession.find({ mentor: mentorId }).select('sessionDate sessionType status').lean(),
    Intervention.find({ mentor: mentorId }).select('startDate status priority').lean(),
    MentorRemark.countDocuments({ mentor: mentorId }),
    Attendance.find({ student: { $in: studentIds } }).select('student status periods date').lean(),
    AcademicRecord.find({ student: { $in: studentIds } }).select('student marksObtained maxMarks').lean(),
    CounselingSession.find({ mentor: mentorId, followUpRequired: true, followUpDate: { $gte: new Date() } })
      .sort({ followUpDate: 1 }).limit(5)
      .populate({ path: 'student', select: 'rollNumber user', populate: { path: 'user', select: 'name avatarColor' } }),
  ]);

  const attByStudent = new Map();
  attendanceDocs.forEach((a) => {
    const k = String(a.student);
    if (!attByStudent.has(k)) attByStudent.set(k, []);
    attByStudent.get(k).push(a);
  });

  const acadByStudent = new Map();
  academicDocs.forEach((a) => {
    const k = String(a.student);
    if (!acadByStudent.has(k)) acadByStudent.set(k, { obtained: 0, max: 0 });
    const e = acadByStudent.get(k);
    e.obtained += a.marksObtained;
    e.max += a.maxMarks;
  });

  const openInterventionAgg = await Intervention.aggregate([
    { $match: { student: { $in: studentIds }, status: { $in: ['planned', 'in-progress', 'escalated'] } } },
    { $group: { _id: '$student', count: { $sum: 1 } } },
  ]);
  const openMap = new Map(openInterventionAgg.map((o) => [String(o._id), o.count]));

  const studentPerformance = students.map((s) => {
    const att = computeAttendanceStats(attByStudent.get(String(s._id)) || []);
    const acad = acadByStudent.get(String(s._id)) || { obtained: 0, max: 0 };
    const avgMarks = acad.max ? Number(((acad.obtained / acad.max) * 100).toFixed(2)) : 0;
    const open = openMap.get(String(s._id)) || 0;

    const factors = [];
    if (att.totalPeriods > 0 && att.percentage < 75) factors.push('Low attendance');
    if (acad.max > 0 && avgMarks < 50) factors.push('Low marks');
    if (open > 0) factors.push('Open interventions');

    return {
      id: s._id,
      name: s.user?.name || 'Unknown',
      avatarColor: s.user?.avatarColor || '#4f46e5',
      rollNumber: s.rollNumber,
      department: s.department,
      year: s.year,
      semester: s.semester,
      attendancePercentage: att.percentage,
      averageMarks: avgMarks,
      openInterventions: open,
      riskLevel: factors.length >= 2 ? 'high' : factors.length === 1 ? 'medium' : 'low',
      riskFactors: factors,
    };
  });

  const allAttendance = computeAttendanceStats(attendanceDocs);

  res.status(200).json({
    success: true,
    data: {
      stats: {
        totalStudents: students.length,
        totalSessions: sessions.length,
        completedSessions: sessions.filter((s) => s.status === 'completed').length,
        scheduledSessions: sessions.filter((s) => s.status === 'scheduled').length,
        totalRemarks: remarks,
        totalInterventions: interventions.length,
        openInterventions: interventions.filter((i) => ['planned', 'in-progress', 'escalated'].includes(i.status)).length,
        criticalInterventions: interventions.filter((i) => i.priority === 'critical').length,
        averageAttendance: allAttendance.percentage,
        atRiskStudents: studentPerformance.filter((s) => s.riskLevel !== 'low').length,
      },
      charts: {
        sessionsTrend: bucketise(sessions, 'sessionDate'),
        interventionsTrend: bucketise(interventions, 'startDate'),
        sessionTypes: Object.entries(
          sessions.reduce((acc, s) => {
            acc[s.sessionType] = (acc[s.sessionType] || 0) + 1;
            return acc;
          }, {})
        ).map(([label, count]) => ({ label, count })),
        attendanceTrend: monthlyAttendanceTrend(attendanceDocs),
        riskDistribution: ['low', 'medium', 'high'].map((level) => ({
          label: level,
          count: studentPerformance.filter((s) => s.riskLevel === level).length,
        })),
      },
      studentPerformance: studentPerformance.sort((a, b) => a.attendancePercentage - b.attendancePercentage),
      upcomingFollowUps,
    },
  });
});

export const getStudentDashboard = asyncHandler(async (req, res) => {
  if (!req.studentProfile) throw new ApiError(403, 'Student profile not found.');
  const studentId = req.studentProfile._id;

  const [student, academics, attendanceDocs, sessions, remarks, interventions] = await Promise.all([
    Student.findById(studentId)
      .populate('user', 'name email phone avatarColor lastLogin')
      .populate({ path: 'mentor', select: 'employeeId department designation officeLocation user', populate: { path: 'user', select: 'name email phone avatarColor' } }),
    AcademicRecord.find({ student: studentId }).lean(),
    Attendance.find({ student: studentId }).lean(),
    CounselingSession.find({ student: studentId, confidential: false }).sort({ sessionDate: -1 }).limit(5)
      .populate({ path: 'mentor', select: 'user', populate: { path: 'user', select: 'name avatarColor' } }),
    MentorRemark.find({ student: studentId, visibleToStudent: true }).sort({ remarkDate: -1 }).limit(5)
      .populate({ path: 'mentor', select: 'user', populate: { path: 'user', select: 'name avatarColor' } }),
    Intervention.find({ student: studentId }).sort({ startDate: -1 }).lean(),
  ]);

  const totalObtained = academics.reduce((s, r) => s + r.marksObtained, 0);
  const totalMax = academics.reduce((s, r) => s + r.maxMarks, 0);
  const averageMarks = totalMax ? Number(((totalObtained / totalMax) * 100).toFixed(2)) : 0;

  const semMap = new Map();
  academics.forEach((r) => {
    if (!semMap.has(r.semester)) semMap.set(r.semester, { obtained: 0, max: 0 });
    const e = semMap.get(r.semester);
    e.obtained += r.marksObtained;
    e.max += r.maxMarks;
  });

  const attendance = computeAttendanceStats(attendanceDocs);

  res.status(200).json({
    success: true,
    data: {
      student,
      stats: {
        averageMarks,
        totalAssessments: academics.length,
        failedAssessments: academics.filter((r) => (r.marksObtained / r.maxMarks) * 100 < 40).length,
        attendancePercentage: attendance.percentage,
        attendanceStatus: attendance.status,
        totalSessions: await CounselingSession.countDocuments({ student: studentId, confidential: false }),
        totalRemarks: await MentorRemark.countDocuments({ student: studentId, visibleToStudent: true }),
        totalInterventions: interventions.length,
        openInterventions: interventions.filter((i) => ['planned', 'in-progress', 'escalated'].includes(i.status)).length,
      },
      charts: {
        semesterPerformance: Array.from(semMap.entries())
          .sort((a, b) => a[0] - b[0])
          .map(([semester, e]) => ({
            label: `Sem ${semester}`,
            percentage: e.max ? Number(((e.obtained / e.max) * 100).toFixed(2)) : 0,
          })),
        attendanceTrend: monthlyAttendanceTrend(attendanceDocs),
        attendanceBySubject: groupAttendanceBySubject(attendanceDocs),
        attendanceBreakdown: [
          { label: 'Present', count: attendance.presentCount },
          { label: 'Absent', count: attendance.absentCount },
          { label: 'Late', count: attendance.lateCount },
          { label: 'Excused', count: attendance.excusedCount },
        ],
      },
      recent: { sessions, remarks, interventions: interventions.slice(0, 5) },
    },
  });
});

export const getDashboard = asyncHandler(async (req, res, next) => {
  if (req.user.role === ROLES.ADMIN) return getAdminDashboard(req, res, next);
  if (req.user.role === ROLES.MENTOR) return getMentorDashboard(req, res, next);
  return getStudentDashboard(req, res, next);
});

export const getSystemUsers = asyncHandler(async (req, res) => {
  const counts = await User.aggregate([{ $group: { _id: '$role', count: { $sum: 1 } } }]);
  res.status(200).json({ success: true, data: counts.map((c) => ({ role: c._id, count: c.count })) });
});
