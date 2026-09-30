import { useCallback, useState } from 'react';
import { sessionApi } from '../../api/endpoints.js';
import { useApi } from '../../hooks/useApi.js';
import { useToast } from '../../context/ToastContext.jsx';
import { SESSION_MODES, SESSION_STATUS, SESSION_TYPES, PRIORITIES } from '../../utils/constants.js';
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
  sessionDate: todayInput(), durationMinutes: 30, sessionType: 'academic', mode: 'in-person',
  priority: 'medium', title: '', issueDiscussed: '', guidanceGiven: '', actionPlan: '',
  studentFeedback: '', followUpRequired: false, followUpDate: '', status: 'completed', confidential: false,
};

const CounselingPanel = ({ studentId, canEdit = false }) => {
  const toast = useToast();
  const [filters, setFilters] = useState({ search: '', sessionType: '', status: '' });
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [deletingBusy, setDeletingBusy] = useState(false);
  const [expanded, setExpanded] = useState(null);

  const fetcher = useCallback(() => sessionApi.list(studentId, filters), [studentId, filters]);
  const { data, loading, error, refetch } = useApi(fetcher, [studentId, filters.search, filters.sessionType, filters.status]);

  const sessions = data?.data || [];
  const summary = data?.summary || {};

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setErrors({});
    setModalOpen(true);
  };

  const openEdit = (s) => {
    setEditing(s);
    setForm({
      sessionDate: toInputDate(s.sessionDate),
      durationMinutes: s.durationMinutes,
      sessionType: s.sessionType,
      mode: s.mode,
      priority: s.priority,
      title: s.title,
      issueDiscussed: s.issueDiscussed,
      guidanceGiven: s.guidanceGiven || '',
      actionPlan: s.actionPlan || '',
      studentFeedback: s.studentFeedback || '',
      followUpRequired: s.followUpRequired,
      followUpDate: toInputDate(s.followUpDate),
      status: s.status,
      confidential: s.confidential,
    });
    setErrors({});
    setModalOpen(true);
  };

  const validate = () => {
    const next = runValidators({
      sessionDate: required(form.sessionDate, 'Session date'),
      sessionType: required(form.sessionType, 'Session type'),
      title: minLength(form.title, 3, 'Title'),
      issueDiscussed: minLength(form.issueDiscussed, 3, 'Issue discussed'),
      followUpDate: form.followUpRequired && !form.followUpDate ? 'Set a follow-up date or turn off follow-up' : '',
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
        durationMinutes: Number(form.durationMinutes) || 30,
        sessionDate: new Date(form.sessionDate).toISOString(),
        followUpDate: form.followUpRequired && form.followUpDate ? new Date(form.followUpDate).toISOString() : null,
      };
      if (editing) {
        await sessionApi.update(studentId, editing._id, payload);
        toast.success('Counseling session updated.');
      } else {
        await sessionApi.create(studentId, payload);
        toast.success('Counseling session recorded.');
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
      await sessionApi.remove(studentId, deleting._id);
      toast.success('Counseling session deleted.');
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
          { label: 'Total sessions', value: summary.total || 0, tone: 'text-ink-900' },
          { label: 'Completed', value: summary.completed || 0, tone: 'text-emerald-600' },
          { label: 'Scheduled', value: summary.scheduled || 0, tone: 'text-sky-600' },
          { label: 'Follow-ups pending', value: summary.followUpsPending || 0, tone: 'text-amber-600' },
        ].map((s) => (
          <div key={s.label} className="card card-pad">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">{s.label}</p>
            <p className={`mt-2 text-2xl font-bold ${s.tone}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchBar
          value={filters.search}
          onChange={(v) => setFilters((f) => ({ ...f, search: v }))}
          placeholder="Search sessions…"
          className="sm:max-w-xs"
        />
        <Select value={filters.sessionType} onChange={(e) => setFilters((f) => ({ ...f, sessionType: e.target.value }))} className="sm:w-44" aria-label="Filter by type">
          <option value="">All types</option>
          {SESSION_TYPES.map((t) => <option key={t} value={t}>{titleCase(t)}</option>)}
        </Select>
        <Select value={filters.status} onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))} className="sm:w-40" aria-label="Filter by status">
          <option value="">All statuses</option>
          {SESSION_STATUS.map((t) => <option key={t} value={t}>{titleCase(t)}</option>)}
        </Select>
        {canEdit && (
          <button type="button" className="btn-primary sm:ml-auto" onClick={openCreate}>
            <IconPlus className="h-4 w-4" /> New session
          </button>
        )}
      </div>

      {loading ? (
        <LoadingState label="Loading counseling sessions…" />
      ) : error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : sessions.length === 0 ? (
        <EmptyState
          title="No counseling sessions"
          message={canEdit ? 'Record your first session with this student.' : 'Session records will appear here after your mentor logs them.'}
          action={canEdit ? <button type="button" className="btn-primary btn-sm" onClick={openCreate}><IconPlus className="h-4 w-4" /> New session</button> : null}
        />
      ) : (
        <ol className="relative space-y-4 border-l-2 border-ink-200 pl-6">
          {sessions.map((s) => {
            const isOpen = expanded === s._id;
            return (
              <li key={s._id} className="relative">
                <span className="absolute -left-[31px] top-4 h-3 w-3 rounded-full border-2 border-white bg-brand-600" />
                <div className="card card-pad">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-sm font-semibold text-ink-900">{s.title}</h4>
                        <Badge value={s.sessionType} tone="bg-brand-50 text-brand-700" />
                        <Badge value={s.status} />
                        <Badge value={s.priority} />
                        {s.confidential && <Badge value="confidential" tone="bg-violet-100 text-violet-700" />}
                      </div>
                      <p className="mt-1.5 text-xs text-ink-500">
                        {formatDate(s.sessionDate)} · {s.durationMinutes} min · {titleCase(s.mode)}
                        {s.mentor?.user?.name ? ` · ${s.mentor.user.name}` : ''}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      {s.mentor?.user && <Avatar name={s.mentor.user.name} color={s.mentor.user.avatarColor} size="sm" />}
                      {canEdit && (
                        <>
                          <button type="button" className="btn-ghost btn-sm" onClick={() => openEdit(s)} aria-label="Edit session">
                            <IconEdit className="h-4 w-4" />
                          </button>
                          <button type="button" className="btn-ghost btn-sm text-red-600 hover:bg-red-50" onClick={() => setDeleting(s)} aria-label="Delete session">
                            <IconTrash className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  <p className={`mt-3 text-sm text-ink-600 ${isOpen ? '' : 'line-clamp-2'}`}>{s.issueDiscussed}</p>

                  {isOpen && (
                    <dl className="mt-4 grid gap-3 border-t border-ink-100 pt-4 sm:grid-cols-2">
                      {[
                        ['Guidance given', s.guidanceGiven],
                        ['Action plan', s.actionPlan],
                        ['Student feedback', s.studentFeedback],
                        ['Follow-up', s.followUpRequired ? formatDate(s.followUpDate) : 'Not required'],
                      ].map(([label, value]) => (
                        <div key={label}>
                          <dt className="text-xs font-semibold uppercase tracking-wide text-ink-500">{label}</dt>
                          <dd className="mt-1 text-sm text-ink-700">{value || '—'}</dd>
                        </div>
                      ))}
                    </dl>
                  )}

                  <button
                    type="button"
                    onClick={() => setExpanded(isOpen ? null : s._id)}
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
        title={editing ? 'Edit counseling session' : 'Record counseling session'}
        onClose={() => setModalOpen(false)}
        size="lg"
        footer={
          <>
            <button type="button" className="btn-secondary" onClick={() => setModalOpen(false)} disabled={saving}>Cancel</button>
            <button type="submit" form="session-form" className="btn-primary" disabled={saving}>
              {saving && <Spinner className="h-4 w-4" />} {editing ? 'Save changes' : 'Record session'}
            </button>
          </>
        }
      >
        <form id="session-form" onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
          <Field label="Title" error={errors.title} required className="sm:col-span-2">
            <TextInput value={form.title} error={errors.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Review of internal assessment performance" />
          </Field>
          <Field label="Session date" error={errors.sessionDate} required>
            <TextInput type="date" value={form.sessionDate} error={errors.sessionDate} onChange={(e) => setForm({ ...form, sessionDate: e.target.value })} />
          </Field>
          <Field label="Duration (minutes)">
            <TextInput type="number" min="5" max="480" value={form.durationMinutes} onChange={(e) => setForm({ ...form, durationMinutes: e.target.value })} />
          </Field>
          <Field label="Session type" error={errors.sessionType} required>
            <Select value={form.sessionType} error={errors.sessionType} onChange={(e) => setForm({ ...form, sessionType: e.target.value })}>
              {SESSION_TYPES.map((t) => <option key={t} value={t}>{titleCase(t)}</option>)}
            </Select>
          </Field>
          <Field label="Mode">
            <Select value={form.mode} onChange={(e) => setForm({ ...form, mode: e.target.value })}>
              {SESSION_MODES.map((t) => <option key={t} value={t}>{titleCase(t)}</option>)}
            </Select>
          </Field>
          <Field label="Priority">
            <Select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
              {PRIORITIES.map((t) => <option key={t} value={t}>{titleCase(t)}</option>)}
            </Select>
          </Field>
          <Field label="Status">
            <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              {SESSION_STATUS.map((t) => <option key={t} value={t}>{titleCase(t)}</option>)}
            </Select>
          </Field>
          <Field label="Issue discussed" error={errors.issueDiscussed} required className="sm:col-span-2">
            <TextArea rows={3} value={form.issueDiscussed} error={errors.issueDiscussed} onChange={(e) => setForm({ ...form, issueDiscussed: e.target.value })} placeholder="What the student raised and the context around it" />
          </Field>
          <Field label="Guidance given" className="sm:col-span-2">
            <TextArea rows={2} value={form.guidanceGiven} onChange={(e) => setForm({ ...form, guidanceGiven: e.target.value })} />
          </Field>
          <Field label="Action plan" className="sm:col-span-2">
            <TextArea rows={2} value={form.actionPlan} onChange={(e) => setForm({ ...form, actionPlan: e.target.value })} />
          </Field>
          <Field label="Student feedback" className="sm:col-span-2">
            <TextArea rows={2} value={form.studentFeedback} onChange={(e) => setForm({ ...form, studentFeedback: e.target.value })} />
          </Field>
          <div className="space-y-3 sm:col-span-2">
            <Checkbox
              label="Follow-up required"
              checked={form.followUpRequired}
              onChange={(e) => setForm({ ...form, followUpRequired: e.target.checked })}
            />
            {form.followUpRequired && (
              <Field label="Follow-up date" error={errors.followUpDate}>
                <TextInput type="date" value={form.followUpDate} error={errors.followUpDate} onChange={(e) => setForm({ ...form, followUpDate: e.target.value })} />
              </Field>
            )}
            <Checkbox
              label="Mark as confidential (hidden from the student)"
              checked={form.confidential}
              onChange={(e) => setForm({ ...form, confidential: e.target.checked })}
            />
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete counseling session"
        message={`This will permanently remove the session "${deleting?.title}".`}
        confirmLabel="Delete"
        loading={deletingBusy}
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
};

export default CounselingPanel;
