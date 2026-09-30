import Attendance from '../models/Attendance.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { computeAttendanceStats, groupAttendanceBySubject, monthlyAttendanceTrend } from '../utils/attendance.js';

export const listAttendance = asyncHandler(async (req, res) => {
  const { semester = '', subjectCode = '', status = '', from = '', to = '' } = req.query;
  const filter = { student: req.targetStudent._id };
  if (semester) filter.semester = Number(semester);
  if (subjectCode) filter.subjectCode = subjectCode.toUpperCase();
  if (status) filter.status = status;
  if (from || to) {
    filter.date = {};
    if (from) filter.date.$gte = new Date(from);
    if (to) filter.date.$lte = new Date(to);
  }

  const records = await Attendance.find(filter).populate('recordedBy', 'name role').sort({ date: -1 });

  res.status(200).json({
    success: true,
    data: records,
    summary: computeAttendanceStats(records),
    bySubject: groupAttendanceBySubject(records),
    trend: monthlyAttendanceTrend(records),
  });
});

export const createAttendance = asyncHandler(async (req, res) => {
  const { date, subjectCode, subjectName, semester, periods, status, reason } = req.body;

  const record = await Attendance.create({
    student: req.targetStudent._id,
    recordedBy: req.user._id,
    date, subjectCode, subjectName, semester,
    periods: periods || 1,
    status,
    reason: reason || '',
  });

  const populated = await Attendance.findById(record._id).populate('recordedBy', 'name role');
  res.status(201).json({ success: true, message: 'Attendance recorded', data: populated });
});

export const updateAttendance = asyncHandler(async (req, res) => {
  const record = await Attendance.findById(req.params.recordId);
  if (!record) throw new ApiError(404, 'Attendance record not found.');
  if (String(record.student) !== String(req.targetStudent._id)) {
    throw new ApiError(403, 'This record does not belong to the specified student.');
  }
  ['date', 'subjectCode', 'subjectName', 'semester', 'periods', 'status', 'reason'].forEach((k) => {
    if (req.body[k] !== undefined) record[k] = req.body[k];
  });
  await record.save();
  const populated = await Attendance.findById(record._id).populate('recordedBy', 'name role');
  res.status(200).json({ success: true, message: 'Attendance updated', data: populated });
});

export const deleteAttendance = asyncHandler(async (req, res) => {
  const record = await Attendance.findById(req.params.recordId);
  if (!record) throw new ApiError(404, 'Attendance record not found.');
  if (String(record.student) !== String(req.targetStudent._id)) {
    throw new ApiError(403, 'This record does not belong to the specified student.');
  }
  await record.deleteOne();
  res.status(200).json({ success: true, message: 'Attendance record deleted' });
});
