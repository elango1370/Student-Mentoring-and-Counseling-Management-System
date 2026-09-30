import mongoose from 'mongoose';

const mentorSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    employeeId: {
      type: String,
      required: [true, 'Employee ID is required'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    department: {
      type: String,
      required: [true, 'Department is required'],
      trim: true,
    },
    designation: {
      type: String,
      trim: true,
      default: 'Assistant Professor',
    },
    specialization: {
      type: String,
      trim: true,
      default: '',
    },
    experienceYears: {
      type: Number,
      min: 0,
      default: 0,
    },
    officeLocation: {
      type: String,
      trim: true,
      default: '',
    },
    maxStudents: {
      type: Number,
      min: 1,
      default: 30,
    },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

mentorSchema.virtual('students', {
  ref: 'Student',
  localField: '_id',
  foreignField: 'mentor',
});

mentorSchema.index({ department: 1 });

const Mentor = mongoose.model('Mentor', mentorSchema);
export default Mentor;
