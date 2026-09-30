import SubjectAllocation from '../models/SubjectAllocation.js';
import Student from '../models/Student.js';
import AcademicRecord from '../models/AcademicRecord.js';
import Mentor from '../models/Mentor.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { ROLES, EXAM_TYPES } from '../config/constants.js';

const POPULATE_MENTOR = { path: 'mentor', select: 'employeeId department user', populate: { path: 'user', select: 'name email' } };

const isAdmin = (req) => req.user.role === ROLES.ADMIN;
const ownsAllocation = (req, alloc) =>
  isAdmin(req) || (req.mentorProfile && String(alloc.mentor?._id || alloc.mentor) === String(req.mentorProfile._id));

export const listSubjects = asyncHandler(async (req, res) => {
  const { department = '', year = '', semester = '', section = '', mentor = '', mine = '' } = req.query;
  const filter = {};
  if (department) filter.department = department;
  if (year) filter.year = Number(year);
  if (semester) filter.semester = Number(semester);
  if (section) filter.section = String(section).toUpperCase();

  if (!isAdmin(req) || mine === 'true') {
    if (!req.mentorProfile) throw new ApiError(403, 'Mentor profile not found.');
    // Mentors only ever see their own subjects.
    filter.mentor = req.mentorProfile._id;
  } else if (mentor) {
    filter.mentor = mentor;
  }

  const data = await SubjectAllocation.find(filter)
    .populate(POPULATE_MENTOR)
    .sort({ department: 1, year: 1, semester: 1, section: 1, subjectCode: 1 })
    .lean();
  res.status(200).json({ success: true, data });
});

export const createSubject = asyncHandler(async (req, res) => {
  const { subjectCode, subjectName, department, year, semester, section, credits, mentor } = req.body;

  let mentorId;
  if (isAdmin(req)) {
    if (!mentor) throw new ApiError(400, 'Choose the mentor who handles this subject.');
    if (!(await Mentor.exists({ _id: mentor }))) throw new ApiError(404, 'Mentor not found.');
    mentorId = mentor;
  } else {
    if (!req.mentorProfile) throw new ApiError(403, 'Mentor profile not found.');
    mentorId = req.mentorProfile._id;
  }

  const code = String(subjectCode).trim().toUpperCase();
  const sec = String(section || 'A').trim().toUpperCase();
  const existing = await SubjectAllocation.findOne({ subjectCode: code, department, semester, section: sec }).populate(POPULATE_MENTOR);
  if (existing) {
    const who = existing.mentor?.user?.name || 'another mentor';
    throw new ApiError(409, `${code} for ${department} Sem ${semester} Sec ${sec} is already handled by ${who}.`);
  }

  const created = await SubjectAllocation.create({
    mentor: mentorId, subjectCode: code, subjectName, department, year, semester, section: sec, credits: credits ?? 3,
  });
  const populated = await SubjectAllocation.findById(created._id).populate(POPULATE_MENTOR);
  res.status(201).json({ success: true, message: 'Subject added', data: populated });
});

export const updateSubject = asyncHandler(async (req, res) => {
  const alloc = await SubjectAllocation.findById(req.params.id);
  if (!alloc) throw new ApiError(404, 'Subject not found.');
  if (!ownsAllocation(req, alloc)) throw new ApiError(403, 'You do not handle this subject.');

  // Only an admin may hand a subject to a different mentor.
  if (req.body.mentor && isAdmin(req)) {
    if (!(await Mentor.exists({ _id: req.body.mentor }))) throw new ApiError(404, 'Mentor not found.');
    alloc.mentor = req.body.mentor;
  }
  ['subjectName', 'credits'].forEach((k) => { if (req.body[k] !== undefined) alloc[k] = req.body[k]; });
  await alloc.save();
  const populated = await SubjectAllocation.findById(alloc._id).populate(POPULATE_MENTOR);
  res.status(200).json({ success: true, message: 'Subject updated', data: populated });
});

export const deleteSubject = asyncHandler(async (req, res) => {
  const alloc = await SubjectAllocation.findById(req.params.id);
  if (!alloc) throw new ApiError(404, 'Subject not found.');
  if (!ownsAllocation(req, alloc)) throw new ApiError(403, 'You do not handle this subject.');
  await alloc.deleteOne();
  res.status(200).json({ success: true, message: 'Subject removed. Existing marks are kept.' });
});

const classStudents = (alloc) =>
  Student.find({ department: alloc.department, section: alloc.section, semester: alloc.semester, status: 'active' })
    .populate('user', 'name email avatarColor')
    .sort({ rollNumber: 1 })
    .lean();

// Class roster for one subject, with any marks already entered for the chosen exam.
export const getSubjectMarks = asyncHandler(async (req, res) => {
  const alloc = await SubjectAllocation.findById(req.params.id).populate(POPULATE_MENTOR).lean();
  if (!alloc) throw new ApiError(404, 'Subject not found.');
  if (!ownsAllocation(req, alloc)) throw new ApiError(403, 'Only the mentor handling this subject can enter its marks.');

  const examType = req.query.examType;
  if (!EXAM_TYPES.includes(examType)) throw new ApiError(400, 'Choose a valid exam type.');

  const students = await classStudents(alloc);
  const records = await AcademicRecord.find({
    student: { $in: students.map((s) => s._id) },
    subjectCode: alloc.subjectCode, semester: alloc.semester, examType,
  }).lean();
  const byStudent = new Map(records.map((r) => [String(r.student), r]));

  res.status(200).json({
    success: true,
    data: {
      subject: alloc,
      examType,
      rows: students.map((s) => ({ student: s, record: byStudent.get(String(s._id)) || null })),
    },
  });
});

// Bulk save (create or update) marks for a class for one subject + exam.
export const saveSubjectMarks = asyncHandler(async (req, res) => {
  const alloc = await SubjectAllocation.findById(req.params.id);
  if (!alloc) throw new ApiError(404, 'Subject not found.');
  if (!ownsAllocation(req, alloc)) throw new ApiError(403, 'Only the mentor handling this subject can enter its marks.');

  const { examType, maxMarks, examDate, entries } = req.body;
  const max = Number(maxMarks);

  const students = await classStudents(alloc);
  const allowed = new Set(students.map((s) => String(s._id)));

  let saved = 0;
  for (const entry of entries) {
    if (entry.marksObtained === '' || entry.marksObtained === null || entry.marksObtained === undefined) continue;
    if (!allowed.has(String(entry.studentId))) {
      throw new ApiError(400, 'One of the students is not in this subject\'s class.');
    }
    const marks = Number(entry.marksObtained);
    if (Number.isNaN(marks) || marks < 0 || marks > max) {
      throw new ApiError(400, `Marks must be between 0 and ${max}.`);
    }
    await AcademicRecord.findOneAndUpdate(
      { student: entry.studentId, subjectCode: alloc.subjectCode, semester: alloc.semester, examType },
      {
        $set: {
          recordedBy: req.user._id,
          subjectName: alloc.subjectName,
          credits: alloc.credits,
          marksObtained: marks,
          maxMarks: max,
          examDate: examDate || new Date(),
        },
      },
      { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
    );
    saved += 1;
  }
  res.status(200).json({ success: true, message: `Marks saved for ${saved} student(s).`, data: { saved } });
});
