import mongoose from 'mongoose';

// One row = "this mentor/faculty handles this subject for this class".
// The unique index guarantees a subject in a class has exactly ONE handler,
// which is what lets us restrict mark entry to that handler alone.
const subjectAllocationSchema = new mongoose.Schema(
  {
    mentor: { type: mongoose.Schema.Types.ObjectId, ref: 'Mentor', required: true },
    subjectCode: { type: String, required: [true, 'Subject code is required'], trim: true, uppercase: true },
    subjectName: { type: String, required: [true, 'Subject name is required'], trim: true },
    department: { type: String, required: [true, 'Department is required'], trim: true },
    year: { type: Number, required: true, min: 1, max: 5 },
    semester: { type: Number, required: true, min: 1, max: 10 },
    section: { type: String, trim: true, uppercase: true, default: 'A' },
    credits: { type: Number, min: 0, default: 3 },
  },
  { timestamps: true }
);

subjectAllocationSchema.index(
  { subjectCode: 1, department: 1, semester: 1, section: 1 },
  { unique: true }
);
subjectAllocationSchema.index({ mentor: 1 });

const SubjectAllocation = mongoose.model('SubjectAllocation', subjectAllocationSchema);
export default SubjectAllocation;
