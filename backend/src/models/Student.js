import mongoose from 'mongoose';

const studentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    rollNumber: {
      type: String,
      required: [true, 'Roll number is required'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    registerNumber: {
      type: String,
      trim: true,
      default: '',
    },
    department: {
      type: String,
      required: [true, 'Department is required'],
      trim: true,
    },
    program: {
      type: String,
      trim: true,
      default: 'B.E.',
    },
    year: {
      type: Number,
      required: [true, 'Year is required'],
      min: 1,
      max: 5,
    },
    semester: {
      type: Number,
      required: [true, 'Semester is required'],
      min: 1,
      max: 10,
    },
    section: {
      type: String,
      trim: true,
      uppercase: true,
      default: 'A',
    },
    dateOfBirth: {
      type: Date,
      default: null,
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'other', ''],
      default: '',
    },
    bloodGroup: {
      type: String,
      trim: true,
      default: '',
    },
    address: {
      type: String,
      trim: true,
      default: '',
    },
    guardianName: {
      type: String,
      trim: true,
      default: '',
    },
    guardianPhone: {
      type: String,
      trim: true,
      default: '',
    },
    hostelResident: {
      type: Boolean,
      default: false,
    },
    admissionYear: {
      type: Number,
      default: () => new Date().getFullYear(),
    },
    mentor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Mentor',
      default: null,
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'graduated'],
      default: 'active',
    },
  },
  { timestamps: true }
);

studentSchema.index({ department: 1, year: 1, semester: 1 });
studentSchema.index({ mentor: 1 });

const Student = mongoose.model('Student', studentSchema);
export default Student;
