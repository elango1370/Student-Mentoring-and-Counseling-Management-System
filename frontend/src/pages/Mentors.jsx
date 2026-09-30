import { useCallback, useState } from 'react';
import { mentorApi, metaApi } from '../api/endpoints.js';
import { useApi } from '../hooks/useApi.js';
import { useToast } from '../context/ToastContext.jsx';
import PageHeader from '../components/PageHeader.jsx';
import SearchBar from '../components/SearchBar.jsx';
import Pagination from '../components/Pagination.jsx';
import Avatar from '../components/Avatar.jsx';
import Badge from '../components/Badge.jsx';
import Modal from '../components/Modal.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import { Checkbox, Field, Select, TextInput } from '../components/Field.jsx';
import { EmptyState, ErrorState, LoadingState, Spinner } from '../components/States.jsx';
import { IconCheck, IconClose, IconEdit, IconPlus, IconShield, IconTrash } from '../components/Icons.jsx';
import { isEmail, isPhone, mergeServerErrors, minLength, nonNegative, required, runValidators } from '../utils/validation.js';

const emptyForm = {
  name: '', email: '', password: '', phone: '', employeeId: '', department: '',
  designation: 'Assistant Professor', specialization: '', experienceYears: 0,
  officeLocation: '', maxStudents: 30, isActive: true,
};

const DESIGNATIONS = ['Professor', 'Associate Professor', 'Assistant Professor', 'Lecturer', 'Counselor'];

const Mentors = () => {
  const toast = useToast();
  const [filters, setFilters] = useState({ search: '', department: '', status: '', page: 1, limit: 12 });
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [deletingBusy, setDeletingBusy] = useState(false);
  const [statusBusyId, setStatusBusyId] = useState(null);

  const fetcher = useCallback(() => mentorApi.list(filters), [filters]);
  const { data, loading, error, refetch } = useApi(fetcher, [filters.search, filters.department, filters.status, filters.page]);
  const { data: deptData } = useApi(metaApi.departments, []);

  const mentors = data?.data || [];
  const pagination = data?.pagination || {};
  const departments = deptData?.data || [];
  const pendingCount = mentors.filter((m) => m.user?.status === 'pending').length;

  const setFilter = (patch) => setFilters((f) => ({ ...f, ...patch, page: patch.page ?? 1 }));

  const setStatus = async (mentor, status) => {
    setStatusBusyId(mentor._id);
    try {
      const res = await mentorApi.updateStatus(mentor._id, status);
      toast.success(res.message || 'Account status updated.');
      refetch();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setStatusBusyId(null);
    }
  };

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setErrors({});
    setModalOpen(true);
  };

  const openEdit = (m) => {
    setEditing(m);
    setForm({
      name: m.user?.name || '',
      email: m.user?.email || '',
      password: '',
      phone: m.user?.phone || '',
      employeeId: m.employeeId || '',
      department: m.department || '',
      designation: m.designation || 'Assistant Professor',
      specialization: m.specialization || '',
      experienceYears: m.experienceYears ?? 0,
      officeLocation: m.officeLocation || '',
      maxStudents: m.maxStudents ?? 30,
      isActive: m.user?.isActive ?? true,
    });
    setErrors({});
    setModalOpen(true);
  };

  const validate = () => {
    const next = runValidators({
      name: minLength(form.name, 2, 'Name'),
      email: isEmail(form.email),
      password: editing ? (form.password ? minLength(form.password, 6, 'Password') : '') : minLength(form.password, 6, 'Password'),
      employeeId: required(form.employeeId, 'Employee ID'),
      department: required(form.department, 'Department'),
      phone: isPhone(form.phone),
      experienceYears: nonNegative(form.experienceYears, 'Experience'),
      maxStudents: nonNegative(form.maxStudents, 'Maximum students'),
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
        experienceYears: Number(form.experienceYears) || 0,
        maxStudents: Number(form.maxStudents) || 30,
      };
      if (!payload.password) delete payload.password;

      if (editing) {
        await mentorApi.update(editing._id, payload);
        toast.success('Mentor updated.');
      } else {
        await mentorApi.create(payload);
        toast.success('Mentor created.');
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
      await mentorApi.remove(deleting._id);
      toast.success('Mentor deleted.');
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
        title="Mentors"
        subtitle={`${pagination.total ?? 0} mentor records`}
        actions={<button type="button" className="btn-primary" onClick={openCreate}><IconPlus className="h-4 w-4" /> Add mentor</button>}
      />

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchBar value={filters.search} onChange={(v) => setFilter({ search: v })} placeholder="Search name, employee ID or specialization…" className="sm:max-w-sm" />
        <Select value={filters.department} onChange={(e) => setFilter({ department: e.target.value })} className="sm:w-56" aria-label="Filter by department">
          <option value="">All departments</option>
          {departments.map((d) => <option key={d} value={d}>{d}</option>)}
        </Select>
        <Select value={filters.status} onChange={(e) => setFilter({ status: e.target.value })} className="sm:w-52" aria-label="Filter by account status">
          <option value="">All statuses</option>
          <option value="pending">Pending approval</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
        </Select>
      </div>

      {pendingCount > 0 && filters.status !== 'pending' && (
        <div className="mb-5 flex items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <span>{pendingCount} faculty {pendingCount === 1 ? 'registration is' : 'registrations are'} awaiting your approval.</span>
          <button type="button" className="btn-secondary btn-sm shrink-0" onClick={() => setFilter({ status: 'pending' })}>Review now</button>
        </div>
      )}

      {loading ? (
        <LoadingState label="Loading mentors…" />
      ) : error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : mentors.length === 0 ? (
        <EmptyState
          title="No mentors found"
          message="Adjust your filters or add a new mentor record."
          action={<button type="button" className="btn-primary btn-sm" onClick={openCreate}><IconPlus className="h-4 w-4" /> Add mentor</button>}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {mentors.map((m) => {
            const load = m.maxStudents ? Math.min(100, Math.round((m.studentCount / m.maxStudents) * 100)) : 0;
            return (
              <div key={m._id} className="card card-pad flex flex-col gap-4">
                <div className="flex items-start gap-3">
                  <Avatar name={m.user?.name} color={m.user?.avatarColor} size="lg" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-base font-semibold text-ink-900">{m.user?.name}</p>
                    <p className="truncate text-xs text-ink-500">{m.user?.email}</p>
                    <p className="mt-1 truncate text-xs font-medium text-brand-700">{m.employeeId} · {m.designation}</p>
                  </div>
                  <Badge value={m.user?.status || 'active'} />
                </div>

                <dl className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <dt className="text-ink-500">Department</dt>
                    <dd className="mt-0.5 font-semibold text-ink-800">{m.department}</dd>
                  </div>
                  <div>
                    <dt className="text-ink-500">Experience</dt>
                    <dd className="mt-0.5 font-semibold text-ink-800">{m.experienceYears || 0} yrs</dd>
                  </div>
                  <div>
                    <dt className="text-ink-500">Specialization</dt>
                    <dd className="mt-0.5 truncate font-semibold text-ink-800">{m.specialization || '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-ink-500">Office</dt>
                    <dd className="mt-0.5 truncate font-semibold text-ink-800">{m.officeLocation || '—'}</dd>
                  </div>
                </dl>

                <div>
                  <div className="flex items-center justify-between text-xs font-medium text-ink-600">
                    <span>Mentee load</span>
                    <span>{m.studentCount} / {m.maxStudents}</span>
                  </div>
                  <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-ink-200">
                    <div className={`h-full rounded-full ${load >= 90 ? 'bg-red-500' : load >= 70 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${load}%` }} />
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-end gap-1 border-t border-ink-100 pt-3">
                  {m.user?.status === 'pending' && (
                    <>
                      <button type="button" className="btn-ghost btn-sm text-emerald-700 hover:bg-emerald-50" disabled={statusBusyId === m._id} onClick={() => setStatus(m, 'active')}>
                        {statusBusyId === m._id ? <Spinner className="h-4 w-4" /> : <IconCheck className="h-4 w-4" />} Approve
                      </button>
                      <button type="button" className="btn-ghost btn-sm text-red-600 hover:bg-red-50" disabled={statusBusyId === m._id} onClick={() => setStatus(m, 'suspended')}>
                        <IconClose className="h-4 w-4" /> Reject
                      </button>
                    </>
                  )}
                  {m.user?.status === 'active' && (
                    <button type="button" className="btn-ghost btn-sm text-amber-700 hover:bg-amber-50" disabled={statusBusyId === m._id} onClick={() => setStatus(m, 'suspended')}>
                      {statusBusyId === m._id ? <Spinner className="h-4 w-4" /> : <IconShield className="h-4 w-4" />} Suspend
                    </button>
                  )}
                  {m.user?.status === 'suspended' && (
                    <button type="button" className="btn-ghost btn-sm text-emerald-700 hover:bg-emerald-50" disabled={statusBusyId === m._id} onClick={() => setStatus(m, 'active')}>
                      {statusBusyId === m._id ? <Spinner className="h-4 w-4" /> : <IconCheck className="h-4 w-4" />} Reactivate
                    </button>
                  )}
                  <button type="button" className="btn-ghost btn-sm" onClick={() => openEdit(m)}>
                    <IconEdit className="h-4 w-4" /> Edit
                  </button>
                  <button type="button" className="btn-ghost btn-sm text-red-600 hover:bg-red-50" onClick={() => setDeleting(m)}>
                    <IconTrash className="h-4 w-4" /> Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {pagination.pages > 1 && (
        <div className="mt-4 rounded-xl border border-ink-200 bg-white">
          <Pagination {...pagination} onChange={(page) => setFilters((f) => ({ ...f, page }))} />
        </div>
      )}

      <Modal
        open={modalOpen}
        title={editing ? 'Edit mentor' : 'Add mentor'}
        description={editing ? 'Update this mentor record and login details.' : 'Create a login and mentor profile.'}
        onClose={() => setModalOpen(false)}
        size="lg"
        footer={
          <>
            <button type="button" className="btn-secondary" onClick={() => setModalOpen(false)} disabled={saving}>Cancel</button>
            <button type="submit" form="mentor-form" className="btn-primary" disabled={saving}>
              {saving && <Spinner className="h-4 w-4" />} {editing ? 'Save changes' : 'Create mentor'}
            </button>
          </>
        }
      >
        <form id="mentor-form" onSubmit={submit} className="space-y-6">
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
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-500">Faculty details</h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Field label="Employee ID" error={errors.employeeId} required>
                <TextInput value={form.employeeId} error={errors.employeeId} onChange={(e) => setForm({ ...form, employeeId: e.target.value })} />
              </Field>
              <Field label="Department" error={errors.department} required>
                <TextInput list="mentor-department-list" value={form.department} error={errors.department} onChange={(e) => setForm({ ...form, department: e.target.value })} />
                <datalist id="mentor-department-list">
                  {departments.map((d) => <option key={d} value={d} />)}
                </datalist>
              </Field>
              <Field label="Designation">
                <Select value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })}>
                  {DESIGNATIONS.map((d) => <option key={d} value={d}>{d}</option>)}
                </Select>
              </Field>
              <Field label="Specialization">
                <TextInput value={form.specialization} onChange={(e) => setForm({ ...form, specialization: e.target.value })} />
              </Field>
              <Field label="Experience (years)" error={errors.experienceYears}>
                <TextInput type="number" min="0" value={form.experienceYears} error={errors.experienceYears} onChange={(e) => setForm({ ...form, experienceYears: e.target.value })} />
              </Field>
              <Field label="Office location">
                <TextInput value={form.officeLocation} onChange={(e) => setForm({ ...form, officeLocation: e.target.value })} />
              </Field>
              <Field label="Maximum mentees" error={errors.maxStudents}>
                <TextInput type="number" min="1" value={form.maxStudents} error={errors.maxStudents} onChange={(e) => setForm({ ...form, maxStudents: e.target.value })} />
              </Field>
            </div>
            <div className="mt-4">
              <Checkbox label="Login enabled" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
            </div>
          </section>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete mentor"
        message={`This permanently deletes ${deleting?.user?.name}. Students assigned to this mentor become unassigned.`}
        confirmLabel="Delete mentor"
        loading={deletingBusy}
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
      />
    </>
  );
};

export default Mentors;
