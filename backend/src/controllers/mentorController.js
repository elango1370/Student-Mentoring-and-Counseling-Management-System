import User from '../models/User.js';
import Mentor from '../models/Mentor.js';
import Student from '../models/Student.js';
import CounselingSession from '../models/CounselingSession.js';
import Intervention from '../models/Intervention.js';
import MentorRemark from '../models/MentorRemark.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { ROLES, ACCOUNT_STATUS } from '../config/constants.js';

const PALETTE = ['#4f46e5', '#0891b2', '#059669', '#d97706', '#dc2626', '#7c3aed', '#db2777'];
const pickColor = () => PALETTE[Math.floor(Math.random() * PALETTE.length)];

export const listMentors = asyncHandler(async (req, res) => {
  const { search = '', department = '', status = '', page = 1, limit = 12 } = req.query;

  const filter = {};
  if (department) filter.department = department;

  if (status) {
    const statusUsers = await User.find({ role: ROLES.MENTOR, status }).select('_id');
    filter.user = { $in: statusUsers.map((u) => u._id) };
  }

  if (search) {
    const rx = new RegExp(search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    const matchedUsers = await User.find({ role: ROLES.MENTOR, $or: [{ name: rx }, { email: rx }] }).select('_id');
    const searchOr = [{ employeeId: rx }, { specialization: rx }, { user: { $in: matchedUsers.map((u) => u._id) } }];
    filter.$and = [...(filter.user ? [{ user: filter.user }] : []), { $or: searchOr }];
    delete filter.user;
  }

  const pageNum = Math.max(1, Number(page));
  const perPage = Math.min(100, Math.max(1, Number(limit)));

  const [mentors, total] = await Promise.all([
    Mentor.find(filter)
      .populate('user', 'name email phone avatarColor isActive status lastLogin')
      .sort({ employeeId: 1 })
      .skip((pageNum - 1) * perPage)
      .limit(perPage)
      .lean(),
    Mentor.countDocuments(filter),
  ]);

  const counts = await Student.aggregate([
    { $match: { mentor: { $ne: null } } },
    { $group: { _id: '$mentor', count: { $sum: 1 } } },
  ]);
  const countMap = new Map(counts.map((c) => [String(c._id), c.count]));

  const data = mentors.map((m) => ({ ...m, studentCount: countMap.get(String(m._id)) || 0 }));

  res.status(200).json({
    success: true,
    data,
    pagination: { page: pageNum, limit: perPage, total, pages: Math.ceil(total / perPage) || 1 },
  });
});

export const getMentor = asyncHandler(async (req, res) => {
  const mentor = await Mentor.findById(req.params.id).populate('user', 'name email phone avatarColor isActive status lastLogin createdAt');
  if (!mentor) throw new ApiError(404, 'Mentor not found.');

  const students = await Student.find({ mentor: mentor._id })
    .populate('user', 'name email avatarColor')
    .sort({ rollNumber: 1 });

  res.status(200).json({ success: true, data: { mentor, students, studentCount: students.length } });
});

export const createMentor = asyncHandler(async (req, res) => {
  const { name, email, password, phone, employeeId, department, designation, specialization, experienceYears, officeLocation, maxStudents } = req.body;

  const existing = await User.findOne({ email: String(email).toLowerCase() });
  if (existing) throw new ApiError(409, 'A user with this email already exists.');

  const empExists = await Mentor.findOne({ employeeId: String(employeeId).toUpperCase() });
  if (empExists) throw new ApiError(409, 'A mentor with this employee ID already exists.');

  const user = await User.create({
    name, email, password, phone: phone || '', role: ROLES.MENTOR, avatarColor: pickColor(),
    status: ACCOUNT_STATUS.ACTIVE,
    emailVerifiedAt: new Date(),
  });

  try {
    const mentor = await Mentor.create({
      user: user._id, employeeId, department,
      designation: designation || 'Assistant Professor',
      specialization: specialization || '',
      experienceYears: experienceYears || 0,
      officeLocation: officeLocation || '',
      maxStudents: maxStudents || 30,
    });
    const populated = await Mentor.findById(mentor._id).populate('user', 'name email phone avatarColor isActive status');
    res.status(201).json({ success: true, message: 'Mentor created successfully', data: populated });
  } catch (err) {
    await User.findByIdAndDelete(user._id);
    throw err;
  }
});

export const updateMentor = asyncHandler(async (req, res) => {
  const mentor = await Mentor.findById(req.params.id);
  if (!mentor) throw new ApiError(404, 'Mentor not found.');

  const { name, email, phone, isActive, password, ...mentorFields } = req.body;

  const user = await User.findById(mentor.user);
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

  ['employeeId', 'department', 'designation', 'specialization', 'experienceYears', 'officeLocation', 'maxStudents'].forEach((key) => {
    if (mentorFields[key] !== undefined) mentor[key] = mentorFields[key];
  });
  await mentor.save();

  const populated = await Mentor.findById(mentor._id).populate('user', 'name email phone avatarColor isActive status');
  res.status(200).json({ success: true, message: 'Mentor updated successfully', data: populated });
});

export const deleteMentor = asyncHandler(async (req, res) => {
  const mentor = await Mentor.findById(req.params.id);
  if (!mentor) throw new ApiError(404, 'Mentor not found.');

  await Student.updateMany({ mentor: mentor._id }, { $set: { mentor: null } });
  await User.findByIdAndDelete(mentor.user);
  await mentor.deleteOne();

  res.status(200).json({ success: true, message: 'Mentor deleted. Assigned students are now unassigned.' });
});

/**
 * Admin-only account lifecycle control for self-registered (or existing)
 * faculty accounts: approve a pending sign-up, suspend a misbehaving account,
 * or reactivate one. isActive is kept in sync so every other check that
 * still reads isActive continues to behave correctly.
 */
export const updateMentorStatus = asyncHandler(async (req, res) => {
  const mentor = await Mentor.findById(req.params.id);
  if (!mentor) throw new ApiError(404, 'Mentor not found.');

  const user = await User.findById(mentor.user);
  if (!user) throw new ApiError(404, 'Linked user account not found.');

  user.status = req.body.status;
  user.isActive = req.body.status === ACCOUNT_STATUS.ACTIVE;
  await user.save();

  const populated = await Mentor.findById(mentor._id).populate('user', 'name email phone avatarColor isActive status');
  const messages = {
    [ACCOUNT_STATUS.ACTIVE]: 'Faculty account approved and activated.',
    [ACCOUNT_STATUS.SUSPENDED]: 'Faculty account suspended.',
    [ACCOUNT_STATUS.PENDING]: 'Faculty account marked as pending.',
  };
  res.status(200).json({ success: true, message: messages[user.status] || 'Account status updated.', data: populated });
});

export const getMyStudents = asyncHandler(async (req, res) => {
  if (!req.mentorProfile) throw new ApiError(403, 'Mentor profile not found.');

  const { search = '', year = '', semester = '', department = '', section = '' } = req.query;
  const filter = { mentor: req.mentorProfile._id };
  if (year) filter.year = Number(year);
  if (section) filter.section = String(section).toUpperCase();
  if (semester) filter.semester = Number(semester);
  if (department) filter.department = department;

  if (search) {
    const rx = new RegExp(search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    const matchedUsers = await User.find({ role: ROLES.STUDENT, $or: [{ name: rx }, { email: rx }] }).select('_id');
    filter.$or = [{ rollNumber: rx }, { user: { $in: matchedUsers.map((u) => u._id) } }];
  }

  const students = await Student.find(filter)
    .populate('user', 'name email phone avatarColor isActive')
    .sort({ rollNumber: 1 })
    .lean();

  const ids = students.map((s) => s._id);
  const [sessionCounts, openInterventions, remarkCounts] = await Promise.all([
    CounselingSession.aggregate([{ $match: { student: { $in: ids } } }, { $group: { _id: '$student', count: { $sum: 1 } } }]),
    Intervention.aggregate([
      { $match: { student: { $in: ids }, status: { $in: ['planned', 'in-progress', 'escalated'] } } },
      { $group: { _id: '$student', count: { $sum: 1 } } },
    ]),
    MentorRemark.aggregate([{ $match: { student: { $in: ids } } }, { $group: { _id: '$student', count: { $sum: 1 } } }]),
  ]);

  const toMap = (arr) => new Map(arr.map((a) => [String(a._id), a.count]));
  const sMap = toMap(sessionCounts);
  const iMap = toMap(openInterventions);
  const rMap = toMap(remarkCounts);

  const data = students.map((s) => ({
    ...s,
    sessionCount: sMap.get(String(s._id)) || 0,
    openInterventions: iMap.get(String(s._id)) || 0,
    remarkCount: rMap.get(String(s._id)) || 0,
  }));

  res.status(200).json({ success: true, data });
});

export const getMyMentorProfile = asyncHandler(async (req, res) => {
  if (!req.mentorProfile) throw new ApiError(404, 'Mentor profile not found.');
  const mentor = await Mentor.findById(req.mentorProfile._id).populate('user', 'name email phone avatarColor lastLogin createdAt');
  const studentCount = await Student.countDocuments({ mentor: mentor._id });
  res.status(200).json({ success: true, data: { mentor, studentCount } });
});

/**
 * Students without a mentor, so a mentor can pick who to mentor.
 * Filterable by department / year / section / semester / search. Also returns
 * facet counts (per department, year, section) to drive the segregated filters.
 */
export const getAvailableStudents = asyncHandler(async (req, res) => {
  if (!req.mentorProfile) throw new ApiError(403, 'Mentor profile not found.');

  const { search = '', year = '', semester = '', department = '', section = '' } = req.query;
  const base = { mentor: null, status: 'active' };

  const filter = { ...base };
  if (department) filter.department = department;
  if (year) filter.year = Number(year);
  if (semester) filter.semester = Number(semester);
  if (section) filter.section = String(section).toUpperCase();

  if (search) {
    const rx = new RegExp(search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    const matchedUsers = await User.find({ role: ROLES.STUDENT, $or: [{ name: rx }, { email: rx }] }).select('_id');
    filter.$or = [{ rollNumber: rx }, { user: { $in: matchedUsers.map((u) => u._id) } }];
  }

  const [students, facetRows, currentCount] = await Promise.all([
    Student.find(filter)
      .populate('user', 'name email avatarColor')
      .sort({ department: 1, year: 1, section: 1, rollNumber: 1 })
      .limit(500)
      .lean(),
    Student.aggregate([
      { $match: base },
      { $group: { _id: { department: '$department', year: '$year', section: '$section' }, count: { $sum: 1 } } },
    ]),
    Student.countDocuments({ mentor: req.mentorProfile._id }),
  ]);

  const uniq = (key) => Array.from(new Set(facetRows.map((f) => f._id[key]))).filter((v) => v !== undefined && v !== '');
  res.status(200).json({
    success: true,
    data: students,
    facets: {
      departments: uniq('department').sort(),
      years: uniq('year').sort((a, b) => a - b),
      sections: uniq('section').sort(),
    },
    capacity: { current: currentCount, max: req.mentorProfile.maxStudents, remaining: Math.max(0, req.mentorProfile.maxStudents - currentCount) },
  });
});

/** Mentor picks students as their own mentees. Only currently unassigned students can be claimed. */
export const claimStudents = asyncHandler(async (req, res) => {
  if (!req.mentorProfile) throw new ApiError(403, 'Mentor profile not found.');
  const { studentIds } = req.body;
  const unique = Array.from(new Set(studentIds.map(String)));

  const currentCount = await Student.countDocuments({ mentor: req.mentorProfile._id });
  const remaining = req.mentorProfile.maxStudents - currentCount;
  if (unique.length > remaining) {
    throw new ApiError(400, `You can mentor at most ${req.mentorProfile.maxStudents} students. You have ${currentCount} and ${Math.max(0, remaining)} slot(s) left.`);
  }

  // The mentor: null condition makes this atomic — a student claimed by someone else in the meantime is skipped.
  const result = await Student.updateMany(
    { _id: { $in: unique }, mentor: null, status: 'active' },
    { $set: { mentor: req.mentorProfile._id } }
  );
  const skipped = unique.length - result.modifiedCount;
  res.status(200).json({
    success: true,
    message: `${result.modifiedCount} student(s) added to your mentees.${skipped ? ` ${skipped} were already taken by another mentor.` : ''}`,
    data: { claimed: result.modifiedCount, skipped },
  });
});

/** Mentor gives up some of their own mentees (they return to the unassigned pool). */
export const releaseStudents = asyncHandler(async (req, res) => {
  if (!req.mentorProfile) throw new ApiError(403, 'Mentor profile not found.');
  const result = await Student.updateMany(
    { _id: { $in: req.body.studentIds }, mentor: req.mentorProfile._id },
    { $set: { mentor: null } }
  );
  res.status(200).json({ success: true, message: `${result.modifiedCount} student(s) released.`, data: { released: result.modifiedCount } });
});
