import { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import { mentorApi, metaApi, subjectApi } from '../api/endpoints.js';
import { useApi } from '../hooks/useApi.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import PageHeader from '../components/PageHeader.jsx';
import Modal from '../components/Modal.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import { Field, Select, TextInput } from '../components/Field.jsx';
import { EmptyState, ErrorState, LoadingState, Spinner } from '../components/States.jsx';
import { IconPlus, IconTrash } from '../components/Icons.jsx';
import { SEMESTERS, YEARS } from '../utils/constants.js';

const emptyForm = { subjectCode: '', subjectName: '', department: '', year: 1, semester: 1, section: 'A', credits: 3, mentor: '' };

const Subjects = () => {
  const { role } = useAuth();
  const isAdmin = role === 'admin';
  const toast = useToast();
  const [filters, setFilters] = useState({ department: '', year: '', section: '' });
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [deletingBusy, setDeletingBusy] = useState(false);

  const fetcher = useCallback(() => subjectApi.list(filters), [filters]);
  const { data, loading, error, refetch } = useApi(fetcher, [filters.department, filters.year, filters.section]);
  const { data: deptData } = useApi(metaApi.departments, []);
  const { data: mentorsData } = useApi(() => (isAdmin ? mentorApi.list({ limit: 100 }) : Promise.resolve(null)), [isAdmin]);
  const { data: meData } = useApi(() => (isAdmin ? Promise.resolve(null) : mentorApi.myProfile()), [isAdmin]);

  const subjects = data?.data || [];
  const departments = deptData?.data || [];
  const mentors = mentorsData?.data || [];
  const myDept = meData?.data?.mentor?.department || '';

  const openCreate = () => {
    setForm({ ...emptyForm, department: isAdmin ? '' : myDept });
    setOpen(true);
  };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await subjectApi.create({
        ...form,
        year: Number(form.year), semester: Number(form.semester), credits: Number(form.credits) || 3,
        section: form.section.trim() || 'A',
        mentor: isAdmin ? form.mentor : undefined,
      });
      toast.success('Subject added.');
      setOpen(false);
      refetch();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    setDeletingBusy(true);
    try {
      await subjectApi.remove(deleting._id);
      toast.success('Subject removed.');
      setDeleting(null);
      refetch();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDeletingBusy(false);
    }
  };

  return (
    <>
      <PageHeader
        title={isAdmin ? 'Subject handlers' : 'My subjects & marks'}
        subtitle={isAdmin
          ? 'Each subject in a class has exactly one handling mentor, and only that mentor can enter its marks.'
          : 'Add the subjects you handle, then enter marks for the whole class. Only you can enter marks for these subjects.'}
        actions={<button type="button" className="btn-primary" onClick={openCreate}><IconPlus className="h-4 w-4" /> {isAdmin ? 'Assign subject' : 'Add my subject'}</button>}
      />

      <div className="mb-5 flex flex-col gap-3 sm:flex-row">
        {isAdmin && (
          <Select value={filters.department} onChange={(e) => setFilters((f) => ({ ...f, department: e.target.value }))} className="sm:w-48" aria-label="Filter by department">
            <option value="">All departments</option>
            {departments.map((d) => <option key={d} value={d}>{d}</option>)}
          </Select>
        )}
        <Select value={filters.year} onChange={(e) => setFilters((f) => ({ ...f, year: e.target.value }))} className="sm:w-32" aria-label="Filter by year">
          <option value="">All years</option>
          {YEARS.map((y) => <option key={y} value={y}>Year {y}</option>)}
        </Select>
        <TextInput value={filters.section} onChange={(e) => setFilters((f) => ({ ...f, section: e.target.value }))} placeholder="Section" className="sm:w-28" aria-label="Filter by section" />
      </div>

      {loading ? (
        <LoadingState label="Loading subjects…" />
      ) : error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : subjects.length === 0 ? (
        <EmptyState title="No subjects yet" message={isAdmin ? 'Assign a subject to a mentor to get started.' : 'Add the subjects you teach to start entering marks.'} />
      ) : (
        <div className="table-wrap">
          <table className="min-w-full divide-y divide-ink-200">
            <thead className="bg-ink-50">
              <tr>
                <th className="th">Subject</th>
                <th className="th">Class</th>
                {isAdmin && <th className="th">Handled by</th>}
                <th className="th text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {subjects.map((s) => (
                <tr key={s._id} className="hover:bg-ink-50">
                  <td className="td">
                    <p className="font-semibold text-ink-900">{s.subjectCode}</p>
                    <p className="text-xs text-ink-500">{s.subjectName}</p>
                  </td>
                  <td className="td text-sm">{s.department} · Year {s.year} · Sem {s.semester} · Sec {s.section}</td>
                  {isAdmin && <td className="td text-sm">{s.mentor?.user?.name || '—'}</td>}
                  <td className="td text-right">
                    <div className="flex justify-end gap-2">
                      <Link to={`/subjects/${s._id}/marks`} className="btn-secondary btn-sm">Enter marks</Link>
                      <button type="button" className="btn-ghost btn-sm text-red-600 hover:bg-red-50" onClick={() => setDeleting(s)} aria-label="Remove subject">
                        <IconTrash className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        open={open}
        title={isAdmin ? 'Assign subject to a mentor' : 'Add a subject you handle'}
        description="A subject can only have one handler per department, semester and section."
        onClose={() => setOpen(false)}
        size="lg"
        footer={
          <>
            <button type="button" className="btn-secondary" onClick={() => setOpen(false)} disabled={saving}>Cancel</button>
            <button type="submit" form="subject-form" className="btn-primary" disabled={saving}>{saving && <Spinner className="h-4 w-4" />} Save</button>
          </>
        }
      >
        <form id="subject-form" onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
          <Field label="Subject code" required><TextInput required value={form.subjectCode} onChange={(e) => setForm({ ...form, subjectCode: e.target.value })} placeholder="CS301" /></Field>
          <Field label="Subject name" required><TextInput required value={form.subjectName} onChange={(e) => setForm({ ...form, subjectName: e.target.value })} placeholder="Data Structures" /></Field>
          <Field label="Department" required>
            {isAdmin || !myDept ? (
              <>
                <TextInput required list="dept-list" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} />
                <datalist id="dept-list">{departments.map((d) => <option key={d} value={d} />)}</datalist>
              </>
            ) : (
              <Select value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })}>
                {Array.from(new Set([myDept, ...departments])).map((d) => <option key={d} value={d}>{d}</option>)}
              </Select>
            )}
          </Field>
          <Field label="Section" required><TextInput required value={form.section} onChange={(e) => setForm({ ...form, section: e.target.value })} /></Field>
          <Field label="Year" required>
            <Select value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })}>{YEARS.map((y) => <option key={y} value={y}>Year {y}</option>)}</Select>
          </Field>
          <Field label="Semester" required>
            <Select value={form.semester} onChange={(e) => setForm({ ...form, semester: e.target.value })}>{SEMESTERS.map((s) => <option key={s} value={s}>Semester {s}</option>)}</Select>
          </Field>
          <Field label="Credits"><TextInput type="number" min="0" value={form.credits} onChange={(e) => setForm({ ...form, credits: e.target.value })} /></Field>
          {isAdmin && (
            <Field label="Handling mentor" required>
              <Select required value={form.mentor} onChange={(e) => setForm({ ...form, mentor: e.target.value })}>
                <option value="">Choose a mentor…</option>
                {mentors.map((m) => <option key={m._id} value={m._id}>{m.user?.name} · {m.department}</option>)}
              </Select>
            </Field>
          )}
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Remove subject"
        message={`${deleting?.subjectCode} will no longer be handled by ${isAdmin ? 'this mentor' : 'you'}. Marks already entered are kept.`}
        confirmLabel="Remove"
        loading={deletingBusy}
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
      />
    </>
  );
};

export default Subjects;
