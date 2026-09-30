import { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import { mentorApi, metaApi, studentApi } from '../api/endpoints.js';
import { useApi } from '../hooks/useApi.js';
import { useToast } from '../context/ToastContext.jsx';
import PageHeader from '../components/PageHeader.jsx';
import SearchBar from '../components/SearchBar.jsx';
import Pagination from '../components/Pagination.jsx';
import Avatar from '../components/Avatar.jsx';
import Badge from '../components/Badge.jsx';
import Modal from '../components/Modal.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import { Checkbox, Field, Select, TextArea, TextInput } from '../components/Field.jsx';
import { EmptyState, ErrorState, LoadingState, Spinner } from '../components/States.jsx';
import { IconEdit, IconPlus, IconTrash, IconUsers } from '../components/Icons.jsx';
import { formatDate, toInputDate } from '../utils/format.js';
import { inRange, isEmail, isPhone, mergeServerErrors, minLength, required, runValidators } from '../utils/validation.js';
import { SEMESTERS, YEARS } from '../utils/constants.js';

const emptyForm = {
  name: '', email: '', password: '', phone: '', rollNumber: '', registerNumber: '',
  department: '', program: 'B.E.', year: '', semester: '', section: 'A',
  dateOfBirth: '', gender: '', bloodGroup: '', address: '', guardianName: '',
  guardianPhone: '', hostelResident: false, admissionYear: new Date().getFullYear(),
  mentor: '', status: 'active', isActive: true,
};

const Students = () => {
  const toast = useToast();
  const [filters, setFilters] = useState({ search: '', department: '', year: '', semester: '', status: '', page: 1, limit: 12 });
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [deletingBusy, setDeletingBusy] = useState(false);

  const fetcher = useCallback(() => studentApi.list(filters), [filters]);
  const { data, loading, error, refetch } = useApi(fetcher, [
    filters.search, filters.department, filters.year, filters.semester, filters.status, filters.page,
  ]);

  const { data: mentorsData } = useApi(() => mentorApi.list({ limit: 100 }), []);
  const { data: deptData } = useApi(metaApi.departments, []);

  const students = data?.data || [];
  const pagination = data?.pagination || {};
  const mentors = mentorsData?.data || [];
  const departments = deptData?.data || [];

  const setFilter = (patch) => setFilters((f) => ({ ...f, ...patch, page: patch.page ?? 1 }));

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setErrors({});
    setModalOpen(true);
  };

  const openEdit = (s) => {
    setEditing(s);
    setForm({
      name: s.user?.name || '',
      email: s.user?.email || '',
      password: '',
      phone: s.user?.phone || '',
      rollNumber: s.rollNumber,
      registerNumber: s.registerNumber || '',
      department: s.department,
      program: s.program || 'B.E.',
      year: s.year,
      semester: s.semester,
      section: s.section || 'A',
      dateOfBirth: toInputDate(s.dateOfBirth),
      gender: s.gender || '',
      bloodGroup: s.bloodGroup || '',
      address: s.address || '',
      guardianName: s.guardianName || '',
      guardianPhone: s.guardianPhone || '',
      hostelResident: s.hostelResident || false,
      admissionYear: s.admissionYear || new Date().getFullYear(),
      mentor: s.mentor?._id || '',
      status: s.status || 'active',
      isActive: s.user?.isActive ?? true,
    });
    setErrors({});
    setModalOpen(true);
  };

  const validate = () => {
    const next = runValidators({
      name: minLength(form.name, 2, 'Name'),
      email: isEmail(form.email),
      password: editing ? (form.password ? minLength(form.password, 6, 'Password') : '') : minLength(form.password, 6, 'Password'),
      rollNumber: required(form.rollNumber, 'Roll number'),
      department: required(form.department, 'Department'),
      year: inRange(form.year, 1, 5, 'Year'),
      semester: inRange(form.semester, 1, 10, 'Semester'),
      phone: isPhone(form.phone),
      guardianPhone: isPhone(form.guardianPhone),
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
        year: Number(form.year),
        semester: Number(form.semester),
        admissionYear: Number(form.admissionYear) || new Date().getFullYear(),
        dateOfBirth: form.dateOfBirth || null,
        mentor: form.mentor || null,
      };
      if (!payload.password) delete payload.password;

      if (editing) {
        await studentApi.update(editing._id, payload);
        toast.success('Student updated.');
      } else {
        await studentApi.create(payload);
        toast.success('Student created.');
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
      await studentApi.remove(deleting._id);
      toast.success('Student and related records deleted.');
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
        title="Students"
        subtitle={`${pagination.total ?? 0} student records`}
        actions={<button type="button" className="btn-primary" onClick={openCreate}><IconPlus className="h-4 w-4" /> Add student</button>}
      />

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <SearchBar value={filters.search} onChange={(v) => setFilter({ search: v })} placeholder="Search name, roll number or email…" className="sm:max-w-xs" />
        <Select value={filters.department} onChange={(e) => setFilter({ department: e.target.value })} className="sm:w-52" aria-label="Filter by department">
          <option value="">All departments</option>
          {departments.map((d) => <option key={d} value={d}>{d}</option>)}
        </Select>
        <Select value={filters.year} onChange={(e) => setFilter({ year: e.target.value })} className="sm:w-32" aria-label="Filter by year">
          <option value="">All years</option>
          {YEARS.map((y) => <option key={y} value={y}>Year {y}</option>)}
        </Select>
        <Select value={filters.semester} onChange={(e) => setFilter({ semester: e.target.value })} className="sm:w-40" aria-label="Filter by semester">
          <option value="">All semesters</option>
          {SEMESTERS.map((s) => <option key={s} value={s}>Semester {s}</option>)}
        </Select>
        <Select value={filters.status} onChange={(e) => setFilter({ status: e.target.value })} className="sm:w-36" aria-label="Filter by status">
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="graduated">Graduated</option>
        </Select>
      </div>

      {loading ? (
        <LoadingState label="Loading students…" />
      ) : error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : students.length === 0 ? (
        <EmptyState
          title="No students found"
          message="Adjust your filters or add a new student record."
          action={<button type="button" className="btn-primary btn-sm" onClick={openCreate}><IconPlus className="h-4 w-4" /> Add student</button>}
        />
      ) : (
        <div className="table-wrap">
          <table className="min-w-full divide-y divide-ink-200">
            <thead className="bg-ink-50">
              <tr>
                <th className="th">Student</th>
                <th className="th">Roll number</th>
                <th className="th">Department</th>
                <th className="th">Year / Sem</th>
                <th className="th">Mentor</th>
                <th className="th">Status</th>
                <th className="th text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {students.map((s) => (
                <tr key={s._id} className="transition hover:bg-ink-50">
                  <td className="td">
                    <Link to={`/students/${s._id}`} className="flex items-center gap-3">
                      <Avatar name={s.user?.name} color={s.user?.avatarColor} size="sm" />
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-ink-900">{s.user?.name}</p>
                        <p className="truncate text-xs text-ink-500">{s.user?.email}</p>
                      </div>
                    </Link>
                  </td>
                  <td className="td font-medium">{s.rollNumber}</td>
                  <td className="td">{s.department}</td>
                  <td className="td">Year {s.year} · Sem {s.semester}</td>
                  <td className="td">
                    {s.mentor?.user?.name ? (
                      <span className="text-ink-700">{s.mentor.user.name}</span>
                    ) : (
                      <span className="badge bg-amber-100 text-amber-700">Unassigned</span>
                    )}
                  </td>
                  <td className="td"><Badge value={s.status} /></td>
                  <td className="td text-right">
                    <div className="flex justify-end gap-1">
                      <Link to={`/students/${s._id}`} className="btn-ghost btn-sm" aria-label="View profile">
                        <IconUsers className="h-4 w-4" />
                      </Link>
                      <button type="button" className="btn-ghost btn-sm" onClick={() => openEdit(s)} aria-label="Edit student">
                        <IconEdit className="h-4 w-4" />
                      </button>
                      <button type="button" className="btn-ghost btn-sm text-red-600 hover:bg-red-50" onClick={() => setDeleting(s)} aria-label="Delete student">
                        <IconTrash className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination {...pagination} onChange={(page) => setFilters((f) => ({ ...f, page }))} />
        </div>
      )}

      <Modal
        open={modalOpen}
        title={editing ? 'Edit student' : 'Add student'}
        description={editing ? 'Update this student record and login details.' : 'Create a login and student profile.'}
        onClose={() => setModalOpen(false)}
        size="xl"
        footer={
          <>
            <button type="button" className="btn-secondary" onClick={() => setModalOpen(false)} disabled={saving}>Cancel</button>
            <button type="submit" form="student-form" className="btn-primary" disabled={saving}>
              {saving && <Spinner className="h-4 w-4" />} {editing ? 'Save changes' : 'Create student'}
            </button>
          </>
        }
      >
        <form id="student-form" onSubmit={submit} className="space-y-6">
          <section>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-500">Account</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Full name" error={errors.name} required>
                <TextInput value={form.name} error={errors.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </Field>
              <Field label="Email" error={errors.email} required>
                <TextInput type="email" value={form.email} error={errors.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </Field>
              <Field label={editing ? 'New password' : 'Password'} error={errors.password} required={!editing} hint={editing ? 'Leave blank to keep the current password' : 'Minimum 6 characters'}>
                <TextInput type="password" autoComplete="new-password" value={form.password} error={errors.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
              </Field>
              <Field label="Phone" error={errors.phone}>
                <TextInput value={form.phone} error={errors.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </Field>
            </div>
          </section>

          <section>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-500">Academic</h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Field label="Roll number" error={errors.rollNumber} required>
                <TextInput value={form.rollNumber} error={errors.rollNumber} onChange={(e) => setForm({ ...form, rollNumber: e.target.value })} />
              </Field>
              <Field label="Register number">
                <TextInput value={form.registerNumber} onChange={(e) => setForm({ ...form, registerNumber: e.target.value })} />
              </Field>
              <Field label="Department" error={errors.department} required>
                <TextInput list="department-list" value={form.department} error={errors.department} onChange={(e) => setForm({ ...form, department: e.target.value })} />
                <datalist id="department-list">
                  {departments.map((d) => <option key={d} value={d} />)}
                </datalist>
              </Field>
              <Field label="Programme">
                <TextInput value={form.program} onChange={(e) => setForm({ ...form, program: e.target.value })} />
              </Field>
              <Field label="Year" error={errors.year} required>
                <Select value={form.year} error={errors.year} onChange={(e) => setForm({ ...form, year: e.target.value })}>
                  <option value="">Select year</option>
                  {YEARS.map((y) => <option key={y} value={y}>Year {y}</option>)}
                </Select>
              </Field>
              <Field label="Semester" error={errors.semester} required>
                <Select value={form.semester} error={errors.semester} onChange={(e) => setForm({ ...form, semester: e.target.value })}>
                  <option value="">Select semester</option>
                  {SEMESTERS.map((s) => <option key={s} value={s}>Semester {s}</option>)}
                </Select>
              </Field>
              <Field label="Section">
                <TextInput value={form.section} onChange={(e) => setForm({ ...form, section: e.target.value })} />
              </Field>
              <Field label="Admission year">
                <TextInput type="number" value={form.admissionYear} onChange={(e) => setForm({ ...form, admissionYear: e.target.value })} />
              </Field>
              <Field label="Assigned mentor">
                <Select value={form.mentor} onChange={(e) => setForm({ ...form, mentor: e.target.value })}>
                  <option value="">Unassigned</option>
                  {mentors.map((m) => (
                    <option key={m._id} value={m._id}>{m.user?.name} · {m.department}</option>
                  ))}
                </Select>
              </Field>
            </div>
          </section>

          <section>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-500">Personal</h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Field label="Date of birth">
                <TextInput type="date" value={form.dateOfBirth} onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })} />
              </Field>
              <Field label="Gender">
                <Select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
                  <option value="">Not specified</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </Select>
              </Field>
              <Field label="Blood group">
                <TextInput value={form.bloodGroup} onChange={(e) => setForm({ ...form, bloodGroup: e.target.value })} />
              </Field>
              <Field label="Guardian name">
                <TextInput value={form.guardianName} onChange={(e) => setForm({ ...form, guardianName: e.target.value })} />
              </Field>
              <Field label="Guardian phone" error={errors.guardianPhone}>
                <TextInput value={form.guardianPhone} error={errors.guardianPhone} onChange={(e) => setForm({ ...form, guardianPhone: e.target.value })} />
              </Field>
              <Field label="Enrolment status">
                <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="graduated">Graduated</option>
                </Select>
              </Field>
              <Field label="Address" className="sm:col-span-2 lg:col-span-3">
                <TextArea rows={2} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
              </Field>
            </div>
            <div className="mt-4 flex flex-wrap gap-5">
              <Checkbox label="Hostel resident" checked={form.hostelResident} onChange={(e) => setForm({ ...form, hostelResident: e.target.checked })} />
              <Checkbox label="Login enabled" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
            </div>
          </section>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete student"
        message={`This permanently deletes ${deleting?.user?.name} along with all academic, attendance, counseling, remark and intervention records.`}
        confirmLabel="Delete student"
        loading={deletingBusy}
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
      />
    </>
  );
};

export default Students;
