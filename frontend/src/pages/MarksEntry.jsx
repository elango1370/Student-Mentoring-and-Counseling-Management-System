import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { subjectApi } from '../api/endpoints.js';
import { useApi } from '../hooks/useApi.js';
import { useToast } from '../context/ToastContext.jsx';
import PageHeader from '../components/PageHeader.jsx';
import Avatar from '../components/Avatar.jsx';
import { Field, Select, TextInput } from '../components/Field.jsx';
import { EmptyState, ErrorState, LoadingState, Spinner } from '../components/States.jsx';
import { EXAM_TYPES } from '../utils/constants.js';
import { toInputDate, todayInput } from '../utils/format.js';

const MarksEntry = () => {
  const { id } = useParams();
  const toast = useToast();
  const [examType, setExamType] = useState(EXAM_TYPES[0]);
  const [maxMarks, setMaxMarks] = useState(50);
  const [examDate, setExamDate] = useState(todayInput());
  const [marks, setMarks] = useState({});
  const [saving, setSaving] = useState(false);

  const fetcher = useCallback(() => subjectApi.getMarks(id, examType), [id, examType]);
  const { data, loading, error, refetch } = useApi(fetcher, [id, examType]);

  const subject = data?.data?.subject;
  const rows = data?.data?.rows || [];

  // Pre-fill from marks already saved for this exam.
  useEffect(() => {
    if (!data) return;
    const next = {};
    let firstRecord = null;
    rows.forEach((r) => {
      next[r.student._id] = r.record ? String(r.record.marksObtained) : '';
      if (r.record && !firstRecord) firstRecord = r.record;
    });
    setMarks(next);
    if (firstRecord) {
      setMaxMarks(firstRecord.maxMarks);
      setExamDate(toInputDate(firstRecord.examDate));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  const invalid = (v) => v !== '' && (Number.isNaN(Number(v)) || Number(v) < 0 || Number(v) > Number(maxMarks));
  const hasInvalid = Object.values(marks).some(invalid);
  const filled = Object.values(marks).filter((v) => v !== '').length;

  const save = async () => {
    if (hasInvalid) { toast.error(`Marks must be between 0 and ${maxMarks}.`); return; }
    setSaving(true);
    try {
      const res = await subjectApi.saveMarks(id, {
        examType, maxMarks: Number(maxMarks), examDate,
        entries: rows.map((r) => ({ studentId: r.student._id, marksObtained: marks[r.student._id] ?? '' })),
      });
      toast.success(res.message);
      refetch();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeader
        title={subject ? `${subject.subjectCode} — ${subject.subjectName}` : 'Enter marks'}
        subtitle={subject ? `${subject.department} · Year ${subject.year} · Sem ${subject.semester} · Section ${subject.section}` : ''}
        actions={<Link to="/subjects" className="btn-secondary">Back to subjects</Link>}
      />

      <div className="card card-pad mb-5 grid gap-4 sm:grid-cols-3">
        <Field label="Exam type">
          <Select value={examType} onChange={(e) => setExamType(e.target.value)}>
            {EXAM_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </Select>
        </Field>
        <Field label="Maximum marks"><TextInput type="number" min="1" value={maxMarks} onChange={(e) => setMaxMarks(e.target.value)} /></Field>
        <Field label="Exam date"><TextInput type="date" value={examDate} onChange={(e) => setExamDate(e.target.value)} /></Field>
      </div>

      {loading ? (
        <LoadingState label="Loading class list…" />
      ) : error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : rows.length === 0 ? (
        <EmptyState title="No students in this class" message="No active students match this subject's department, semester and section." />
      ) : (
        <>
          <div className="table-wrap">
            <table className="min-w-full divide-y divide-ink-200">
              <thead className="bg-ink-50">
                <tr>
                  <th className="th">Student</th>
                  <th className="th">Roll number</th>
                  <th className="th w-40">Marks (out of {maxMarks})</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {rows.map((r) => (
                  <tr key={r.student._id}>
                    <td className="td">
                      <div className="flex items-center gap-3">
                        <Avatar name={r.student.user?.name} color={r.student.user?.avatarColor} size="sm" />
                        <span className="font-semibold text-ink-900">{r.student.user?.name}</span>
                      </div>
                    </td>
                    <td className="td">{r.student.rollNumber}</td>
                    <td className="td">
                      <TextInput
                        type="number" min="0" max={maxMarks} step="0.5"
                        value={marks[r.student._id] ?? ''}
                        error={invalid(marks[r.student._id] ?? '')}
                        onChange={(e) => setMarks((m) => ({ ...m, [r.student._id]: e.target.value }))}
                        aria-label={`Marks for ${r.student.user?.name}`}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-ink-500">{filled} of {rows.length} entered. Blank rows are skipped.</p>
            <button type="button" className="btn-primary" onClick={save} disabled={saving || hasInvalid || filled === 0}>
              {saving && <Spinner className="h-4 w-4" />} Save marks
            </button>
          </div>
        </>
      )}
    </>
  );
};

export default MarksEntry;
