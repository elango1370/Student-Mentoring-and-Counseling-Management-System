import { useCallback, useState } from 'react';
import { interventionApi } from '../../api/endpoints.js';
import { useApi } from '../../hooks/useApi.js';
import { useToast } from '../../context/ToastContext.jsx';
import { INTERVENTION_STATUS, INTERVENTION_TYPES, PRIORITIES } from '../../utils/constants.js';
import { formatDate, titleCase, toInputDate, todayInput } from '../../utils/format.js';
import { mergeServerErrors, minLength, required, runValidators } from '../../utils/validation.js';
import { EmptyState, ErrorState, LoadingState, Spinner } from '../States.jsx';
import { Checkbox, Field, Select, TextArea, TextInput } from '../Field.jsx';
import { IconEdit, IconPlus, IconTrash } from '../Icons.jsx';
import Avatar from '../Avatar.jsx';
import Badge from '../Badge.jsx';
import Modal from '../Modal.jsx';
import ConfirmDialog from '../ConfirmDialog.jsx';
import SearchBar from '../SearchBar.jsx';

const emptyForm = {
  interventionType: 'academic-support', title: '', reason: '', actionTaken: '', outcome: '',
  priority: 'medium', status: 'planned', startDate: todayInput(), targetDate: '', parentNotified: false,
};

const InterventionPanel = ({ studentId, canEdit = false }) => {
  const toast = useToast();
  const [filters, setFilters] = useState({ search: '', interventionType: '', status: '', priority: '' });
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [deletingBusy, setDeletingBusy] = useState(false);
  const [expanded, setExpanded] = useState(null);

  const fetcher = useCallback(() => interventionApi.list(studentId, filters), [studentId, filters]);
  const { data, loading, error, refetch } = useApi(fetcher, [
    studentId, filters.search, filters.interventionType, filters.status, filters.priority,
  ]);

  const interventions = data?.data || [];
  const summary = data?.summary || {};

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setErrors({});
    setModalOpen(true);
  };

  const openEdit = (i) => {
    setEditing(i);
    setForm({
      interventionType: i.interventionType,
      title: i.title,
      reason: i.reason,
      actionTaken: i.actionTaken || '',
      outcome: i.outcome || '',
      priority: i.priority,
      status: i.status,
      startDate: toInputDate(i.startDate),
      targetDate: toInputDate(i.targetDate),
      parentNotified: i.parentNotified,
    });
    setErrors({});
    setModalOpen(true);
  };

  const validate = () => {
    const next = runValidators({
      interventionType: required(form.interventionType, 'Intervention type'),
      title: minLength(form.title, 3, 'Title'),
      reason: minLength(form.reason, 3, 'Reason'),
      startDate: required(form.startDate, 'Start date'),
      targetDate:
        form.targetDate && new Date(form.targetDate) < new Date(form.startDate)
          ? 'Target date cannot be before the start date'
          : '',
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
        startDate: new Date(form.startDate).toISOString(),
        targetDate: form.targetDate ? new Date(form.targetDate).toISOString() : null,
      };
      if (editing) {
        await interventionApi.update(studentId, editing._id, payload);
        toast.success('Intervention updated.');
      } else {
        await interventionApi.create(studentId, payload);
        toast.success('Intervention created.');
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
      await interventionApi.remove(studentId, deleting._id);
      toast.success('Intervention deleted.');
      setDeleting(null);
      refetch();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDeletingBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Total', value: summary.total || 0, tone: 'text-ink-900' },
          { label: 'Open', value: summary.open || 0, tone: 'text-amber-600' },
          { label: 'Completed', value: summary.completed || 0, tone: 'text-emerald-600' },
          { label: 'Critical', value: summary.critical || 0, tone: 'text-red-600' },
        ].map((s) => (
          <div key={s.label} className="card card-pad">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">{s.label}</p>
            <p className={`mt-2 text-2xl font-bold ${s.tone}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <SearchBar value={filters.search} onChange={(v) => setFilters((f) => ({ ...f, search: v }))} placeholder="Search interventions…" className="sm:max-w-xs" />
        <Select value={filters.interventionType} onChange={(e) => setFilters((f) => ({ ...f, interventionType: e.target.value }))} className="sm:w-48" aria-label="Filter by type">
          <option value="">All types</option>
          {INTERVENTION_TYPES.map((t) => <option key={t} value={t}>{titleCase(t)}</option>)}
        </Select>
        <Select value={filters.status} onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))} className="sm:w-40" aria-label="Filter by status">
          <option value="">All statuses</option>
          {INTERVENTION_STATUS.map((t) => <option key={t} value={t}>{titleCase(t)}</option>)}
        </Select>
        <Select value={filters.priority} onChange={(e) => setFilters((f) => ({ ...f, priority: e.target.value }))} className="sm:w-36" aria-label="Filter by priority">
          <option value="">All priorities</option>
          {PRIORITIES.map((t) => <option key={t} value={t}>{titleCase(t)}</option>)}
        </Select>
        {canEdit && (
          <button type="button" className="btn-primary sm:ml-auto" onClick={openCreate}>
            <IconPlus className="h-4 w-4" /> New intervention
          </button>
        )}
      </div>

      {loading ? (
        <LoadingState label="Loading interventions…" />
      ) : error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : interventions.length === 0 ? (
        <EmptyState
          title="No interventions recorded"
          message={canEdit ? 'Create an intervention when a student needs structured support.' : 'Any support actions taken for you will appear here.'}
          action={canEdit ? <button type="button" className="btn-primary btn-sm" onClick={openCreate}><IconPlus className="h-4 w-4" /> New intervention</button> : null}
        />
      ) : (
        <ol className="relative space-y-4 border-l-2 border-ink-200 pl-6">
          {interventions.map((i) => {
            const isOpen = expanded === i._id;
            return (
              <li key={i._id} className="relative">
                <span
                  className={`absolute -left-[31px] top-4 h-3 w-3 rounded-full border-2 border-white ${
                    i.priority === 'critical' ? 'bg-red-600' : i.priority === 'high' ? 'bg-orange-500' : 'bg-brand-600'
                  }`}
                />
                <div className="card card-pad">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-sm font-semibold text-ink-900">{i.title}</h4>
                        <Badge value={i.interventionType} tone="bg-brand-50 text-brand-700" />
                        <Badge value={i.status} />
                        <Badge value={i.priority} />
                        {i.parentNotified && <Badge value="parent notified" tone="bg-sky-100 text-sky-700" />}
                      </div>
                      <p className="mt-1.5 text-xs text-ink-500">
                        Started {formatDate(i.startDate)}
                        {i.targetDate ? ` · Target ${formatDate(i.targetDate)}` : ''}
                        {i.completedDate ? ` · Completed ${formatDate(i.completedDate)}` : ''}
                        {i.mentor?.user?.name ? ` · ${i.mentor.user.name}` : ''}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      {i.mentor?.user && <Avatar name={i.mentor.user.name} color={i.mentor.user.avatarColor} size="sm" />}
                      {canEdit && (
                        <>
                          <button type="button" className="btn-ghost btn-sm" onClick={() => openEdit(i)} aria-label="Edit intervention">
                            <IconEdit className="h-4 w-4" />
                          </button>
                          <button type="button" className="btn-ghost btn-sm text-red-600 hover:bg-red-50" onClick={() => setDeleting(i)} aria-label="Delete intervention">
                            <IconTrash className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  <p className={`mt-3 text-sm text-ink-600 ${isOpen ? '' : 'line-clamp-2'}`}>{i.reason}</p>

                  {isOpen && (
                    <dl className="mt-4 grid gap-3 border-t border-ink-100 pt-4 sm:grid-cols-2">
                      <div>
                        <dt className="text-xs font-semibold uppercase tracking-wide text-ink-500">Action taken</dt>
                        <dd className="mt-1 text-sm text-ink-700">{i.actionTaken || '—'}</dd>
                      </div>
                      <div>
                        <dt className="text-xs font-semibold uppercase tracking-wide text-ink-500">Outcome</dt>
                        <dd className="mt-1 text-sm text-ink-700">{i.outcome || '—'}</dd>
                      </div>
                    </dl>
                  )}

                  <button
                    type="button"
                    onClick={() => setExpanded(isOpen ? null : i._id)}
                    className="mt-3 text-xs font-semibold text-brand-600 transition hover:text-brand-700"
                  >
                    {isOpen ? 'Show less' : 'Show details'}
                  </button>
                </div>
              </li>
            );
          })}
        </ol>
      )}

      <Modal
        open={modalOpen}
        title={editing ? 'Edit intervention' : 'New intervention'}
        onClose={() => setModalOpen(false)}
        size="lg"
        footer={
          <>
            <button type="button" className="btn-secondary" onClick={() => setModalOpen(false)} disabled={saving}>Cancel</button>
            <button type="submit" form="intervention-form" className="btn-primary" disabled={saving}>
              {saving && <Spinner className="h-4 w-4" />} {editing ? 'Save changes' : 'Create intervention'}
            </button>
          </>
        }
      >
        <form id="intervention-form" onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
          <Field label="Title" error={errors.title} required className="sm:col-span-2">
            <TextInput value={form.title} error={errors.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Structured academic support plan" />
          </Field>
          <Field label="Intervention type" error={errors.interventionType} required>
            <Select value={form.interventionType} error={errors.interventionType} onChange={(e) => setForm({ ...form, interventionType: e.target.value })}>
              {INTERVENTION_TYPES.map((t) => <option key={t} value={t}>{titleCase(t)}</option>)}
            </Select>
          </Field>
          <Field label="Priority">
            <Select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
              {PRIORITIES.map((t) => <option key={t} value={t}>{titleCase(t)}</option>)}
            </Select>
          </Field>
          <Field label="Status">
            <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              {INTERVENTION_STATUS.map((t) => <option key={t} value={t}>{titleCase(t)}</option>)}
            </Select>
          </Field>
          <Field label="Start date" error={errors.startDate} required>
            <TextInput type="date" value={form.startDate} error={errors.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
          </Field>
          <Field label="Target date" error={errors.targetDate}>
            <TextInput type="date" value={form.targetDate} error={errors.targetDate} onChange={(e) => setForm({ ...form, targetDate: e.target.value })} />
          </Field>
          <Field label="Reason" error={errors.reason} required className="sm:col-span-2">
            <TextArea rows={3} value={form.reason} error={errors.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} placeholder="What triggered this intervention" />
          </Field>
          <Field label="Action taken" className="sm:col-span-2">
            <TextArea rows={2} value={form.actionTaken} onChange={(e) => setForm({ ...form, actionTaken: e.target.value })} />
          </Field>
          <Field label="Outcome" className="sm:col-span-2">
            <TextArea rows={2} value={form.outcome} onChange={(e) => setForm({ ...form, outcome: e.target.value })} />
          </Field>
          <div className="sm:col-span-2">
            <Checkbox
              label="Parent or guardian has been notified"
              checked={form.parentNotified}
              onChange={(e) => setForm({ ...form, parentNotified: e.target.checked })}
            />
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete intervention"
        message={`This will permanently remove "${deleting?.title}".`}
        confirmLabel="Delete"
        loading={deletingBusy}
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
};

export default InterventionPanel;
