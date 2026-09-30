import mongoose from 'mongoose';
import { SESSION_TYPES, SESSION_STATUS, SESSION_MODES, PRIORITIES } from '../config/constants.js';

const counselingSessionSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
    },
    mentor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Mentor',
      required: true,
    },
    sessionDate: {
      type: Date,
      required: [true, 'Session date is required'],
    },
    durationMinutes: {
      type: Number,
      min: 5,
      max: 480,
      default: 30,
    },
    sessionType: {
      type: String,
      enum: SESSION_TYPES,
      required: [true, 'Session type is required'],
    },
    mode: {
      type: String,
      enum: SESSION_MODES,
      default: 'in-person',
    },
    priority: {
      type: String,
      enum: PRIORITIES,
      default: 'medium',
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: 140,
    },
    issueDiscussed: {
      type: String,
      required: [true, 'Issue discussed is required'],
      trim: true,
    },
    guidanceGiven: {
      type: String,
      trim: true,
      default: '',
    },
    actionPlan: {
      type: String,
      trim: true,
      default: '',
    },
    studentFeedback: {
      type: String,
      trim: true,
      default: '',
    },
    followUpRequired: {
      type: Boolean,
      default: false,
    },
    followUpDate: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: SESSION_STATUS,
      default: 'completed',
    },
    confidential: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

counselingSessionSchema.index({ student: 1, sessionDate: -1 });
counselingSessionSchema.index({ mentor: 1, sessionDate: -1 });

const CounselingSession = mongoose.model('CounselingSession', counselingSessionSchema);
export default CounselingSession;
