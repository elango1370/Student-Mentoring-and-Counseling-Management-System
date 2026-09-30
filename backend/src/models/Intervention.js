import mongoose from 'mongoose';
import { INTERVENTION_TYPES, INTERVENTION_STATUS, PRIORITIES } from '../config/constants.js';

const interventionSchema = new mongoose.Schema(
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
    interventionType: {
      type: String,
      enum: INTERVENTION_TYPES,
      required: [true, 'Intervention type is required'],
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: 140,
    },
    reason: {
      type: String,
      required: [true, 'Reason is required'],
      trim: true,
    },
    actionTaken: {
      type: String,
      trim: true,
      default: '',
    },
    outcome: {
      type: String,
      trim: true,
      default: '',
    },
    priority: {
      type: String,
      enum: PRIORITIES,
      default: 'medium',
    },
    status: {
      type: String,
      enum: INTERVENTION_STATUS,
      default: 'planned',
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
      default: Date.now,
    },
    targetDate: {
      type: Date,
      default: null,
    },
    completedDate: {
      type: Date,
      default: null,
    },
    parentNotified: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

interventionSchema.index({ student: 1, startDate: -1 });
interventionSchema.index({ mentor: 1, status: 1 });

const Intervention = mongoose.model('Intervention', interventionSchema);
export default Intervention;
