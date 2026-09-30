import mongoose from 'mongoose';
import { EXAM_TYPES } from '../config/constants.js';

const academicRecordSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
    },
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    semester: {
      type: Number,
      required: [true, 'Semester is required'],
      min: 1,
      max: 10,
    },
    subjectCode: {
      type: String,
      required: [true, 'Subject code is required'],
      trim: true,
      uppercase: true,
    },
    subjectName: {
      type: String,
      required: [true, 'Subject name is required'],
      trim: true,
    },
    examType: {
      type: String,
      enum: EXAM_TYPES,
      required: [true, 'Exam type is required'],
    },
    marksObtained: {
      type: Number,
      required: [true, 'Marks obtained is required'],
      min: [0, 'Marks cannot be negative'],
    },
    maxMarks: {
      type: Number,
      required: [true, 'Maximum marks is required'],
      min: [1, 'Maximum marks must be at least 1'],
    },
    credits: {
      type: Number,
      min: 0,
      default: 3,
    },
    examDate: {
      type: Date,
      default: Date.now,
    },
    remarks: {
      type: String,
      trim: true,
      default: '',
    },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

academicRecordSchema.virtual('percentage').get(function getPercentage() {
  if (!this.maxMarks) return 0;
  return Number(((this.marksObtained / this.maxMarks) * 100).toFixed(2));
});

academicRecordSchema.virtual('grade').get(function getGrade() {
  const pct = this.maxMarks ? (this.marksObtained / this.maxMarks) * 100 : 0;
  if (pct >= 90) return 'O';
  if (pct >= 80) return 'A+';
  if (pct >= 70) return 'A';
  if (pct >= 60) return 'B+';
  if (pct >= 50) return 'B';
  if (pct >= 40) return 'C';
  return 'F';
});

academicRecordSchema.virtual('passed').get(function getPassed() {
  const pct = this.maxMarks ? (this.marksObtained / this.maxMarks) * 100 : 0;
  return pct >= 40;
});

academicRecordSchema.index({ student: 1, semester: 1 });

const AcademicRecord = mongoose.model('AcademicRecord', academicRecordSchema);
export default AcademicRecord;
