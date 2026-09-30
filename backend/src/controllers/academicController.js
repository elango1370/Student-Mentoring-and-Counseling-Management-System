import AcademicRecord from '../models/AcademicRecord.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { handlesSubject } from '../middleware/access.js';

const NOT_YOUR_SUBJECT = 'Marks for this subject can only be entered by the mentor who handles it.';

const withEditable = (record, scope) => {
  const obj = record.toObject ? record.toObject() : record;
  obj.editable = scope.admin || handlesSubject(scope, obj.subjectCode, obj.semester);
  return obj;
};

export const listAcademicRecords = asyncHandler(async (req, res) => {
  const { semester = '', examType = '', search = '' } = req.query;
  const scope = req.academicScope;
  const filter = { student: req.targetStudent._id };
  const and = [];
  if (semester) filter.semester = Number(semester);
  if (examType) filter.examType = examType;
  if (search) {
    const rx = new RegExp(search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    and.push({ $or: [{ subjectCode: rx }, { subjectName: rx }] });
  }
  // A subject handler who is not the student's mentor only sees their own subjects.
  if (!scope.viewAll) {
    and.push({ $or: scope.handled.map((h) => ({ subjectCode: h.subjectCode, semester: h.semester })) });
  }
  if (and.length) filter.$and = and;

  const found = await AcademicRecord.find(filter)
    .populate('recordedBy', 'name role')
    .sort({ semester: -1, examDate: -1 });
  const records = found.map((r) => {
    const obj = withEditable(r, scope);
    // keep virtuals used by the summary below
    return { ...obj, percentage: r.percentage, passed: r.passed, grade: r.grade };
  });

  const totalObtained = records.reduce((s, r) => s + r.marksObtained, 0);
  const totalMax = records.reduce((s, r) => s + r.maxMarks, 0);

  res.status(200).json({
    success: true,
    data: records,
    summary: {
      totalRecords: records.length,
      averagePercentage: totalMax ? Number(((totalObtained / totalMax) * 100).toFixed(2)) : 0,
      highest: records.length ? Math.max(...records.map((r) => r.percentage)) : 0,
      lowest: records.length ? Math.min(...records.map((r) => r.percentage)) : 0,
      failedCount: records.filter((r) => !r.passed).length,
    },
    handledSubjects: scope.handled,
  });
});

export const createAcademicRecord = asyncHandler(async (req, res) => {
  const scope = req.academicScope;
  const { semester, subjectCode, subjectName, examType, marksObtained, maxMarks, credits, examDate, remarks } = req.body;

  if (Number(marksObtained) > Number(maxMarks)) {
    throw new ApiError(400, 'Marks obtained cannot exceed maximum marks.');
  }
  if (!scope.admin && !handlesSubject(scope, subjectCode, semester)) {
    throw new ApiError(403, NOT_YOUR_SUBJECT);
  }

  const record = await AcademicRecord.create({
    student: req.targetStudent._id,
    recordedBy: req.user._id,
    semester, subjectCode, subjectName, examType,
    marksObtained, maxMarks,
    credits: credits || 3,
    examDate: examDate || new Date(),
    remarks: remarks || '',
  });

  const populated = await AcademicRecord.findById(record._id).populate('recordedBy', 'name role');
  res.status(201).json({ success: true, message: 'Academic record added', data: populated });
});

export const updateAcademicRecord = asyncHandler(async (req, res) => {
  const scope = req.academicScope;
  const record = await AcademicRecord.findById(req.params.recordId);
  if (!record) throw new ApiError(404, 'Academic record not found.');
  if (String(record.student) !== String(req.targetStudent._id)) {
    throw new ApiError(403, 'This record does not belong to the specified student.');
  }
  if (!scope.admin && !handlesSubject(scope, record.subjectCode, record.semester)) {
    throw new ApiError(403, NOT_YOUR_SUBJECT);
  }

  // Handlers may correct marks/dates, but cannot move a record to another subject.
  const fields = scope.admin
    ? ['semester', 'subjectCode', 'subjectName', 'examType', 'marksObtained', 'maxMarks', 'credits', 'examDate', 'remarks']
    : ['examType', 'marksObtained', 'maxMarks', 'examDate', 'remarks'];
  fields.forEach((k) => {
    if (req.body[k] !== undefined) record[k] = req.body[k];
  });

  if (record.marksObtained > record.maxMarks) {
    throw new ApiError(400, 'Marks obtained cannot exceed maximum marks.');
  }

  record.recordedBy = req.user._id;
  await record.save();
  const populated = await AcademicRecord.findById(record._id).populate('recordedBy', 'name role');
  res.status(200).json({ success: true, message: 'Academic record updated', data: populated });
});

export const deleteAcademicRecord = asyncHandler(async (req, res) => {
  const scope = req.academicScope;
  const record = await AcademicRecord.findById(req.params.recordId);
  if (!record) throw new ApiError(404, 'Academic record not found.');
  if (String(record.student) !== String(req.targetStudent._id)) {
    throw new ApiError(403, 'This record does not belong to the specified student.');
  }
  if (!scope.admin && !handlesSubject(scope, record.subjectCode, record.semester)) {
    throw new ApiError(403, NOT_YOUR_SUBJECT);
  }
  await record.deleteOne();
  res.status(200).json({ success: true, message: 'Academic record deleted' });
});
