import mongoose from 'mongoose';
import { ATTENDANCE_STATUS } from '../config/constants.js';

const attendanceSchema = new mongoose.Schema(
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
    date: {
      type: Date,
      required: [true, 'Date is required'],
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
    semester: {
      type: Number,
      required: true,
      min: 1,
      max: 10,
    },
    periods: {
      type: Number,
      min: 1,
      max: 10,
      default: 1,
    },
    status: {
      type: String,
      enum: ATTENDANCE_STATUS,
      required: [true, 'Status is required'],
      default: 'present',
    },
    reason: {
      type: String,
      trim: true,
      default: '',
    },
  },
  { timestamps: true }
);

attendanceSchema.index({ student: 1, date: -1 });
attendanceSchema.index({ student: 1, subjectCode: 1 });

const Attendance = mongoose.model('Attendance', attendanceSchema);
export default Attendance;
