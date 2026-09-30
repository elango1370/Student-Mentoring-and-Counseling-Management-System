import mongoose from 'mongoose';
import { REMARK_CATEGORIES } from '../config/constants.js';

const mentorRemarkSchema = new mongoose.Schema(
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
    category: {
      type: String,
      enum: REMARK_CATEGORIES,
      required: [true, 'Category is required'],
    },
    sentiment: {
      type: String,
      enum: ['positive', 'neutral', 'negative'],
      default: 'neutral',
    },
    remark: {
      type: String,
      required: [true, 'Remark is required'],
      trim: true,
      maxlength: 1000,
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      default: 3,
    },
    visibleToStudent: {
      type: Boolean,
      default: true,
    },
    remarkDate: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

mentorRemarkSchema.index({ student: 1, remarkDate: -1 });

const MentorRemark = mongoose.model('MentorRemark', mentorRemarkSchema);
export default MentorRemark;
