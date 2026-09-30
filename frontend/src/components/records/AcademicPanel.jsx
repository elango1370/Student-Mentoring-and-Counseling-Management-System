import { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import { academicApi } from '../../api/endpoints.js';
import { useApi } from '../../hooks/useApi.js';
import { useToast } from '../../context/ToastContext.jsx';
import { EXAM_TYPES, SEMESTERS } from '../../utils/constants.js';
import { formatDate, gradeFor, percentTone, toInputDate, todayInput } from '../../utils/format.js';
import { inRange, mergeServerErrors, nonNegative, required, runValidators } from '../../utils/validation.js';
import { EmptyState, ErrorState, LoadingState, Spinner } from '../States.jsx';
import { BarChartCard, ChartCard, ProgressBar } from '../Charts.jsx';
import { Field, Select, TextArea, TextInput } from '../Field.jsx';
import { IconEdit, IconPlus, IconTrash } from '../Icons.jsx';
import Modal from '../Modal.jsx';
import ConfirmDialog from '../ConfirmDialog.jsx';
import SearchBar from '../SearchBar.jsx';

const emptyForm = {
  semester: '', subjectCode: '', subjectName: '', examType: 'Internal 1',
  marksObtained: '', maxMarks: 50, credits: 3, examDate: todayInput(), remarks: '',
};

const AcademicPanel = ({ studentId, canEdit = false, isAdmin = false, defaultSemester }) => {
  const toast = useToast();
  const [filters, setFilters] = useState({ search: '', semester: '', examType: '' });
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [deletingBusy, setDeletingBusy] = useState(false);

  const fetcher = useCallback(() => academicApi.list(studentId, filters), [studentId, filters]);
  const { data, loading, error, refetch } = useApi(fetcher, [studentId, filters.search, filters.semester, filters.examType]);

  const records = data?.data || [];
  const summary = data?.summary || {};

  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyForm, semester: defaultSemester || '' });
    setErrors({});
    setModalOpen(true);
  };

  const openEdit = (record) => {
    setEditing(record);
    setForm({
      semester: record.semester,
      subjectCode: record.subjectCode,
      subjectName: record.subjectName,
      examType: record.examType,
      marksObtained: record.marksObtained,
      maxMarks: record.maxMarks,
      credits: record.credits,
      examDate: toInputDate(record.examDate),
      remarks: record.remarks || '',
    });
    setErrors({});
    setModalOpen(true);
  };

  const validate = () => {
    const next = runValidators({
      semester: inRange(form.semester, 1, 10, 'Semester'),
      subjectCode: required(form.subjectCode, 'Subject code'),
      subjectName: required(form.subjectName, 'Subject name'),
      examType: required(form.examType, 'Exam type'),
      marksObtained: nonNegative(form.marksObtained, 'Marks obtained'),
      maxMarks: Number(form.maxMarks) >= 1 ? '' : 'Maximum marks must be at least 1',
    });
    if (!next.marksObtained && !next.maxMarks && Number(form.marksObtained) > Number(form.maxMarks)) {
      next.marksObtained = 'Marks obtained cannot exceed maximum marks';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = {
        ...form,
        semester: Number(form.semester),
        marksObtained: Number(form.marksObtained),
        maxMarks: Number(form.maxMarks),
        credits: Number(form.credits) || 3,
      };
      if (editing) {
        await academicApi.update(studentId, editing._id, payload);
        toast.success('Academic record updated.');
      } else {
        await academicApi.create(studentId, payload);
        toast.success('Academic record added.');
      }
      setModalOpen(false);
      refetch();
    } catch (err) {
      setErrors((prev) => mergeServerErrors(prev, err.details));
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    setDeletingBusy(true);
    try {
      await academicApi.remove(studentId, deleting._id);
      toast.success('Academic record deleted.');
      setDeleting(null);
      refetch();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDeletingBusy(false);
    }
  };

  const subjectChart = records.reduce((acc, r) => {
    const found = acc.find((a) => a.label === r.subjectCode);
    const pctValue = r.maxMarks ? (r.marksObtained / r.maxMarks) * 100 : 0;
    if (found) {
      found.total += pctValue;
      found.n += 1;
      found.count = Number((found.total / found.n).toFixed(1));
    } else {
      acc.push({ label: r.subjectCode, total: pctValue, n: 1, count: Number(pctValue.toFixed(1)) });
    }
    return acc;
  }, []);

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card card-pad">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">Average</p>
          <p className={`mt-2 text-2xl font-bold ${percentTone(summary.averagePercentage || 0)}`}>
            {(summary.averagePercentage || 0).toFixed(1)}%
          </p>
          <div className="mt-3"><ProgressBar value={summary.averagePercentage || 0} /></div>
        </div>
        <div className="card card-pad">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">Assessments</p>
          <p className="mt-2 text-2xl font-bold text-ink-900">{summary.totalRecords || 0}</p>
        </div>
        <div className="card card-pad">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">Highest</p>
          <p className="mt-2 text-2xl font-bold text-emerald-600">{(summary.highest || 0).toFixed(1)}%</p>
        </div>
        <div className="card card-pad">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">Below Pass</p>
          <p className="mt-2 text-2xl font-bold text-red-600">{summary.failedCount || 0}</p>
        </div>
      </div>

      {subjectChart.length > 0 && (
        <ChartCard title="Average score by subject" subtitle="Percentage across all recorded assessments">
          <BarChartCard data={subjectChart} color="multi" height={240} />
        </ChartCard>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchBar
          value={filters.search}
          onChange={(v) => setFilters((f) => ({ ...f, search: v }))}
          placeholder="Search subject code or name…"
          className="sm:max-w-xs"
        />
        <Select
          value={filters.semester}
          onChange={(e) => setFilters((f) => ({ ...f, semester: e.target.value }))}
          className="sm:w-40"
          aria-label="Filter by semester"
        >
          <option value="">All semesters</option>
          {SEMESTERS.map((s) => <option key={s} value={s}>Semester {s}</option>)}
        </Select>
        <Select
          value={filters.examType}
          onChange={(e) => setFilters((f) => ({ ...f, examType: e.target.value }))}
          className="sm:w-44"
          aria-label="Filter by exam type"
        >
          <option value="">All exam types</option>
          {EXAM_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </Select>
        {canEdit && isAdmin && (
          <button type="button" className="btn-primary sm:ml-auto" onClick={openCreate}>
            <IconPlus className="h-4 w-4" /> Add record
          </button>
        )}
        {canEdit && !isAdmin && (
          <Link to="/subjects" className="btn-secondary sm:ml-auto">Enter marks for my subjects</Link>
        )}
      </div>

      {loading ? (
        <LoadingState label="Loading academic records…" />
      ) : error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : records.length === 0 ? (
        <EmptyState
          title="No academic records"
          message={canEdit && isAdmin ? 'Add the first assessment result for this student.' : canEdit ? 'Marks are entered by each subject\'s handling mentor.' : 'Assessment results will appear here once your subject mentors record them.'}
          action={canEdit && isAdmin ? <button type="button" className="btn-primary btn-sm" onClick={openCreate}><IconPlus className="h-4 w-4" /> Add record</button> : null}
        />
      ) : (
        <div className="table-wrap">
          <table className="min-w-full divide-y divide-ink-200">
            <thead className="bg-ink-50">
              <tr>
                <th className="th">Subject</th>
                <th className="th">Sem</th>
                <th className="th">Exam</th>
                <th className="th">Marks</th>
                <th className="th">Percentage</th>
                <th className="th">Grade</th>
                <th className="th">Entered by</th>
                <th className="th">Date</th>
                {canEdit && <th className="th text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {records.map((r) => {
                const percentage = r.maxMarks ? (r.marksObtained / r.maxMarks) * 100 : 0;
                const grade = gradeFor(r.marksObtained, r.maxMarks);
                return (
                  <tr key={r._id} className="transition hover:bg-ink-50">
                    <td className="td">
                      <p className="font-semibold text-ink-900">{r.subjectCode}</p>
                      <p className="text-xs text-ink-500">{r.subjectName}</p>
                    </td>
                    <td className="td">{r.semester}</td>
                    <td className="td">{r.examType}</td>
                    <td className="td font-medium">{r.marksObtained}/{r.maxMarks}</td>
                    <td className="td">
                      <div className="flex w-32 items-center gap-2">
                        <span className={`w-12 font-semibold ${percentTone(percentage)}`}>{percentage.toFixed(1)}%</span>
                        <ProgressBar value={percentage} />
                      </div>
                    </td>
                    <td className="td">
                      <span className={`badge ${grade === 'F' ? 'bg-red-100 text-red-700' : 'bg-brand-50 text-brand-700'}`}>{grade}</span>
                    </td>
                    <td className="td text-xs text-ink-500">{r.recordedBy?.name || '—'}</td>
                    <td className="td text-ink-500">{formatDate(r.examDate)}</td>
                    {canEdit && (
                      <td className="td text-right">
                        {!r.editable ? (
                          <span className="text-xs text-ink-400">View only</span>
                        ) : (
                        <div className="flex justify-end gap-1">
                          <button type="button" className="btn-ghost btn-sm" onClick={() => openEdit(r)} aria-label="Edit record">
                            <IconEdit className="h-4 w-4" />
                          </button>
                          <button type="button" className="btn-ghost btn-sm text-red-600 hover:bg-red-50" onClick={() => setDeleting(r)} aria-label="Delete record">
                            <IconTrash className="h-4 w-4" />
                          </button>
                        </div>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        open={modalOpen}
        title={editing ? 'Edit academic record' : 'Add academic record'}
        description="Record an assessment result for this student."
        onClose={() => setModalOpen(false)}
        size="lg"
        footer={
          <>
            <button type="button" className="btn-secondary" onClick={() => setModalOpen(false)} disabled={saving}>Cancel</button>
            <button type="submit" form="academic-form" className="btn-primary" disabled={saving}>
              {saving && <Spinner className="h-4 w-4" />} {editing ? 'Save changes' : 'Add record'}
            </button>
          </>
        }
      >
        <form id="academic-form" onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
          <Field label="Subject code" error={errors.subjectCode} required>
            <TextInput disabled={!isAdmin} value={form.subjectCode} error={errors.subjectCode} onChange={(e) => setForm({ ...form, subjectCode: e.target.value })} placeholder="CS301" />
          </Field>
          <Field label="Subject name" error={errors.subjectName} required>
            <TextInput disabled={!isAdmin} value={form.subjectName} error={errors.subjectName} onChange={(e) => setForm({ ...form, subjectName: e.target.value })} placeholder="Data Structures" />
          </Field>
          <Field label="Semester" error={errors.semester} required>
            <Select disabled={!isAdmin} value={form.semester} error={errors.semester} onChange={(e) => setForm({ ...form, semester: e.target.value })}>
              <option value="">Select semester</option>
              {SEMESTERS.map((s) => <option key={s} value={s}>Semester {s}</option>)}
            </Select>
          </Field>
          <Field label="Exam type" error={errors.examType} required>
            <Select value={form.examType} error={errors.examType} onChange={(e) => setForm({ ...form, examType: e.target.value })}>
              {EXAM_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </Select>
          </Field>
          <Field label="Marks obtained" error={errors.marksObtained} required>
            <TextInput type="number" min="0" step="0.5" value={form.marksObtained} error={errors.marksObtained} onChange={(e) => setForm({ ...form, marksObtained: e.target.value })} />
          </Field>
          <Field label="Maximum marks" error={errors.maxMarks} required>
            <TextInput type="number" min="1" value={form.maxMarks} error={errors.maxMarks} onChange={(e) => setForm({ ...form, maxMarks: e.target.value })} />
          </Field>
          <Field label="Credits">
            <TextInput type="number" min="0" value={form.credits} onChange={(e) => setForm({ ...form, credits: e.target.value })} />
          </Field>
          <Field label="Exam date">
            <TextInput type="date" value={form.examDate} onChange={(e) => setForm({ ...form, examDate: e.target.value })} />
          </Field>
          <Field label="Remarks" className="sm:col-span-2">
            <TextArea value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })} placeholder="Optional notes about this assessment" />
          </Field>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete academic record"
        message={`This will permanently remove the ${deleting?.examType} record for ${deleting?.subjectCode}.`}
        confirmLabel="Delete"
        loading={deletingBusy}
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
};

export default AcademicPanel;
