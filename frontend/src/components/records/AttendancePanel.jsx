import { useCallback, useState } from 'react';
import { attendanceApi } from '../../api/endpoints.js';
import { useApi } from '../../hooks/useApi.js';
import { useToast } from '../../context/ToastContext.jsx';
import { ATTENDANCE_STATUS, SEMESTERS } from '../../utils/constants.js';
import { formatDate, percentTone, toInputDate, todayInput } from '../../utils/format.js';
import { inRange, mergeServerErrors, required, runValidators } from '../../utils/validation.js';
import { EmptyState, ErrorState, LoadingState, Spinner } from '../States.jsx';
import { AreaChartCard, ChartCard, GaugeChart, ProgressBar } from '../Charts.jsx';
import { Field, Select, TextArea, TextInput } from '../Field.jsx';
import { IconEdit, IconPlus, IconTrash } from '../Icons.jsx';
import Badge from '../Badge.jsx';
import Modal from '../Modal.jsx';
import ConfirmDialog from '../ConfirmDialog.jsx';

const emptyForm = {
  date: todayInput(), subjectCode: '', subjectName: '', semester: '',
  periods: 1, status: 'present', reason: '',
};

const AttendancePanel = ({ studentId, canEdit = false, defaultSemester }) => {
  const toast = useToast();
  const [filters, setFilters] = useState({ semester: '', status: '', subjectCode: '' });
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [deletingBusy, setDeletingBusy] = useState(false);

  const fetcher = useCallback(() => attendanceApi.list(studentId, filters), [studentId, filters]);
  const { data, loading, error, refetch } = useApi(fetcher, [studentId, filters.semester, filters.status, filters.subjectCode]);

  const records = data?.data || [];
  const summary = data?.summary || {};
  const bySubject = data?.bySubject || [];
  const trend = data?.trend || [];

  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyForm, semester: defaultSemester || '' });
    setErrors({});
    setModalOpen(true);
  };

  const openEdit = (record) => {
    setEditing(record);
    setForm({
      date: toInputDate(record.date),
      subjectCode: record.subjectCode,
      subjectName: record.subjectName,
      semester: record.semester,
      periods: record.periods,
      status: record.status,
      reason: record.reason || '',
    });
    setErrors({});
    setModalOpen(true);
  };

  const validate = () => {
    const next = runValidators({
      date: required(form.date, 'Date'),
      subjectCode: required(form.subjectCode, 'Subject code'),
      subjectName: required(form.subjectName, 'Subject name'),
      semester: inRange(form.semester, 1, 10, 'Semester'),
      periods: inRange(form.periods, 1, 10, 'Periods'),
      status: required(form.status, 'Status'),
    });
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
        periods: Number(form.periods),
        date: new Date(form.date).toISOString(),
      };
      if (editing) {
        await attendanceApi.update(studentId, editing._id, payload);
        toast.success('Attendance record updated.');
      } else {
        await attendanceApi.create(studentId, payload);
        toast.success('Attendance recorded.');
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
      await attendanceApi.remove(studentId, deleting._id);
      toast.success('Attendance record deleted.');
      setDeleting(null);
      refetch();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDeletingBusy(false);
    }
  };

  const subjectOptions = Array.from(new Set(records.map((r) => r.subjectCode)));

  return (
    <div className="space-y-5">
      <div className="grid gap-5 lg:grid-cols-3">
        <ChartCard title="Overall attendance" subtitle="Late counts as present; excused is excluded">
          <GaugeChart value={summary.percentage || 0} label={`${summary.attendedPeriods || 0} of ${summary.totalPeriods || 0} periods`} />
          <div className="mt-2 grid grid-cols-4 gap-2 text-center">
            {[
              { label: 'Present', value: summary.presentCount || 0, tone: 'text-emerald-600' },
              { label: 'Absent', value: summary.absentCount || 0, tone: 'text-red-600' },
              { label: 'Late', value: summary.lateCount || 0, tone: 'text-amber-600' },
              { label: 'Excused', value: summary.excusedCount || 0, tone: 'text-sky-600' },
            ].map((s) => (
              <div key={s.label} className="rounded-lg bg-ink-50 px-2 py-2">
                <p className={`text-lg font-bold ${s.tone}`}>{s.value}</p>
                <p className="text-[11px] text-ink-500">{s.label}</p>
              </div>
            ))}
          </div>
        </ChartCard>

        <ChartCard title="Monthly trend" subtitle="Attendance percentage over the last six months" className="lg:col-span-2">
          <AreaChartCard data={trend} dataKey="percentage" height={286} />
        </ChartCard>
      </div>

      {bySubject.length > 0 && (
        <div className="card card-pad">
          <h3 className="mb-4 text-sm font-semibold text-ink-900">Attendance by subject</h3>
          <div className="space-y-3">
            {bySubject.map((s) => (
              <div key={s.subjectCode} className="flex items-center gap-3">
                <div className="w-36 shrink-0">
                  <p className="truncate text-sm font-semibold text-ink-800">{s.subjectCode}</p>
                  <p className="truncate text-xs text-ink-500">{s.subjectName}</p>
                </div>
                <div className="flex-1"><ProgressBar value={s.percentage} /></div>
                <span className={`w-14 shrink-0 text-right text-sm font-semibold ${percentTone(s.percentage)}`}>
                  {s.percentage.toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Select value={filters.semester} onChange={(e) => setFilters((f) => ({ ...f, semester: e.target.value }))} className="sm:w-40" aria-label="Filter by semester">
          <option value="">All semesters</option>
          {SEMESTERS.map((s) => <option key={s} value={s}>Semester {s}</option>)}
        </Select>
        <Select value={filters.status} onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))} className="sm:w-40" aria-label="Filter by status">
          <option value="">All statuses</option>
          {ATTENDANCE_STATUS.map((s) => <option key={s} value={s}>{s[0].toUpperCase() + s.slice(1)}</option>)}
        </Select>
        <Select value={filters.subjectCode} onChange={(e) => setFilters((f) => ({ ...f, subjectCode: e.target.value }))} className="sm:w-44" aria-label="Filter by subject">
          <option value="">All subjects</option>
          {subjectOptions.map((s) => <option key={s} value={s}>{s}</option>)}
        </Select>
        {canEdit && (
          <button type="button" className="btn-primary sm:ml-auto" onClick={openCreate}>
            <IconPlus className="h-4 w-4" /> Mark attendance
          </button>
        )}
      </div>

      {loading ? (
        <LoadingState label="Loading attendance…" />
      ) : error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : records.length === 0 ? (
        <EmptyState
          title="No attendance records"
          message={canEdit ? 'Mark attendance to begin tracking this student.' : 'Attendance entries will appear here once recorded.'}
          action={canEdit ? <button type="button" className="btn-primary btn-sm" onClick={openCreate}><IconPlus className="h-4 w-4" /> Mark attendance</button> : null}
        />
      ) : (
        <div className="table-wrap">
          <table className="min-w-full divide-y divide-ink-200">
            <thead className="bg-ink-50">
              <tr>
                <th className="th">Date</th>
                <th className="th">Subject</th>
                <th className="th">Sem</th>
                <th className="th">Periods</th>
                <th className="th">Status</th>
                <th className="th">Reason</th>
                {canEdit && <th className="th text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {records.map((r) => (
                <tr key={r._id} className="transition hover:bg-ink-50">
                  <td className="td font-medium text-ink-900">{formatDate(r.date)}</td>
                  <td className="td">
                    <p className="font-semibold text-ink-900">{r.subjectCode}</p>
                    <p className="text-xs text-ink-500">{r.subjectName}</p>
                  </td>
                  <td className="td">{r.semester}</td>
                  <td className="td">{r.periods}</td>
                  <td className="td"><Badge value={r.status} /></td>
                  <td className="td max-w-xs truncate text-ink-500">{r.reason || '—'}</td>
                  {canEdit && (
                    <td className="td text-right">
                      <div className="flex justify-end gap-1">
                        <button type="button" className="btn-ghost btn-sm" onClick={() => openEdit(r)} aria-label="Edit attendance">
                          <IconEdit className="h-4 w-4" />
                        </button>
                        <button type="button" className="btn-ghost btn-sm text-red-600 hover:bg-red-50" onClick={() => setDeleting(r)} aria-label="Delete attendance">
                          <IconTrash className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        open={modalOpen}
        title={editing ? 'Edit attendance record' : 'Mark attendance'}
        onClose={() => setModalOpen(false)}
        size="lg"
        footer={
          <>
            <button type="button" className="btn-secondary" onClick={() => setModalOpen(false)} disabled={saving}>Cancel</button>
            <button type="submit" form="attendance-form" className="btn-primary" disabled={saving}>
              {saving && <Spinner className="h-4 w-4" />} {editing ? 'Save changes' : 'Record attendance'}
            </button>
          </>
        }
      >
        <form id="attendance-form" onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
          <Field label="Date" error={errors.date} required>
            <TextInput type="date" value={form.date} error={errors.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          </Field>
          <Field label="Semester" error={errors.semester} required>
            <Select value={form.semester} error={errors.semester} onChange={(e) => setForm({ ...form, semester: e.target.value })}>
              <option value="">Select semester</option>
              {SEMESTERS.map((s) => <option key={s} value={s}>Semester {s}</option>)}
            </Select>
          </Field>
          <Field label="Subject code" error={errors.subjectCode} required>
            <TextInput value={form.subjectCode} error={errors.subjectCode} onChange={(e) => setForm({ ...form, subjectCode: e.target.value })} placeholder="CS301" />
          </Field>
          <Field label="Subject name" error={errors.subjectName} required>
            <TextInput value={form.subjectName} error={errors.subjectName} onChange={(e) => setForm({ ...form, subjectName: e.target.value })} placeholder="Data Structures" />
          </Field>
          <Field label="Periods" error={errors.periods} required hint="Number of class periods this entry covers">
            <TextInput type="number" min="1" max="10" value={form.periods} error={errors.periods} onChange={(e) => setForm({ ...form, periods: e.target.value })} />
          </Field>
          <Field label="Status" error={errors.status} required>
            <Select value={form.status} error={errors.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              {ATTENDANCE_STATUS.map((s) => <option key={s} value={s}>{s[0].toUpperCase() + s.slice(1)}</option>)}
            </Select>
          </Field>
          <Field label="Reason" className="sm:col-span-2" hint="Required context for excused or absent entries">
            <TextArea value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} placeholder="Medical leave with documentation" />
          </Field>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete attendance record"
        message={`This will remove the ${deleting?.status} entry for ${deleting?.subjectCode} on ${formatDate(deleting?.date)}.`}
        confirmLabel="Delete"
        loading={deletingBusy}
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
};

export default AttendancePanel;
