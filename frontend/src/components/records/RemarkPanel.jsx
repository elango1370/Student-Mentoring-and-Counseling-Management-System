import { useCallback, useState } from 'react';
import { remarkApi } from '../../api/endpoints.js';
import { useApi } from '../../hooks/useApi.js';
import { useToast } from '../../context/ToastContext.jsx';
import { REMARK_CATEGORIES, SENTIMENTS } from '../../utils/constants.js';
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
  category: 'academic', sentiment: 'neutral', remark: '', rating: 3,
  visibleToStudent: true, remarkDate: todayInput(),
};

const Stars = ({ value }) => (
  <span className="flex items-center gap-0.5" aria-label={`Rating ${value} of 5`}>
    {[1, 2, 3, 4, 5].map((i) => (
      <svg key={i} viewBox="0 0 24 24" className={`h-4 w-4 ${i <= value ? 'text-amber-400' : 'text-ink-200'}`} fill="currentColor" aria-hidden="true">
        <path d="m12 17.3-6.2 3.7 1.7-7L2 9.2l7.1-.6L12 2l2.9 6.6 7.1.6-5.5 4.8 1.7 7z" />
      </svg>
    ))}
  </span>
);

const RemarkPanel = ({ studentId, canEdit = false }) => {
  const toast = useToast();
  const [filters, setFilters] = useState({ search: '', category: '', sentiment: '' });
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [deletingBusy, setDeletingBusy] = useState(false);

  const fetcher = useCallback(() => remarkApi.list(studentId, filters), [studentId, filters]);
  const { data, loading, error, refetch } = useApi(fetcher, [studentId, filters.search, filters.category, filters.sentiment]);

  const remarks = data?.data || [];
  const summary = data?.summary || {};

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setErrors({});
    setModalOpen(true);
  };

  const openEdit = (r) => {
    setEditing(r);
    setForm({
      category: r.category,
      sentiment: r.sentiment,
      remark: r.remark,
      rating: r.rating,
      visibleToStudent: r.visibleToStudent,
      remarkDate: toInputDate(r.remarkDate),
    });
    setErrors({});
    setModalOpen(true);
  };

  const validate = () => {
    const next = runValidators({
      category: required(form.category, 'Category'),
      remark: minLength(form.remark, 3, 'Remark'),
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
        rating: Number(form.rating),
        remarkDate: new Date(form.remarkDate).toISOString(),
      };
      if (editing) {
        await remarkApi.update(studentId, editing._id, payload);
        toast.success('Remark updated.');
      } else {
        await remarkApi.create(studentId, payload);
        toast.success('Remark added.');
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
      await remarkApi.remove(studentId, deleting._id);
      toast.success('Remark deleted.');
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
          { label: 'Total remarks', value: summary.total || 0, tone: 'text-ink-900' },
          { label: 'Average rating', value: (summary.averageRating || 0).toFixed(1), tone: 'text-brand-700' },
          { label: 'Positive', value: summary.positive || 0, tone: 'text-emerald-600' },
          { label: 'Concerns', value: summary.negative || 0, tone: 'text-red-600' },
        ].map((s) => (
          <div key={s.label} className="card card-pad">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">{s.label}</p>
            <p className={`mt-2 text-2xl font-bold ${s.tone}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchBar value={filters.search} onChange={(v) => setFilters((f) => ({ ...f, search: v }))} placeholder="Search remarks…" className="sm:max-w-xs" />
        <Select value={filters.category} onChange={(e) => setFilters((f) => ({ ...f, category: e.target.value }))} className="sm:w-44" aria-label="Filter by category">
          <option value="">All categories</option>
          {REMARK_CATEGORIES.map((c) => <option key={c} value={c}>{titleCase(c)}</option>)}
        </Select>
        <Select value={filters.sentiment} onChange={(e) => setFilters((f) => ({ ...f, sentiment: e.target.value }))} className="sm:w-40" aria-label="Filter by sentiment">
          <option value="">All sentiments</option>
          {SENTIMENTS.map((c) => <option key={c} value={c}>{titleCase(c)}</option>)}
        </Select>
        {canEdit && (
          <button type="button" className="btn-primary sm:ml-auto" onClick={openCreate}>
            <IconPlus className="h-4 w-4" /> Add remark
          </button>
        )}
      </div>

      {loading ? (
        <LoadingState label="Loading remarks…" />
      ) : error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : remarks.length === 0 ? (
        <EmptyState
          title="No remarks yet"
          message={canEdit ? 'Add an observation about this student.' : 'Remarks from your mentor will appear here.'}
          action={canEdit ? <button type="button" className="btn-primary btn-sm" onClick={openCreate}><IconPlus className="h-4 w-4" /> Add remark</button> : null}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {remarks.map((r) => (
            <div key={r._id} className="card card-pad flex flex-col">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  {r.mentor?.user && <Avatar name={r.mentor.user.name} color={r.mentor.user.avatarColor} size="sm" />}
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-ink-900">{r.mentor?.user?.name || 'Mentor'}</p>
                    <p className="text-xs text-ink-500">{formatDate(r.remarkDate)}</p>
                  </div>
                </div>
                {canEdit && (
                  <div className="flex shrink-0 gap-1">
                    <button type="button" className="btn-ghost btn-sm" onClick={() => openEdit(r)} aria-label="Edit remark">
                      <IconEdit className="h-4 w-4" />
                    </button>
                    <button type="button" className="btn-ghost btn-sm text-red-600 hover:bg-red-50" onClick={() => setDeleting(r)} aria-label="Delete remark">
                      <IconTrash className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>

              <p className="mt-3 flex-1 text-sm leading-relaxed text-ink-700">{r.remark}</p>

              <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-ink-100 pt-3">
                <Badge value={r.category} tone="bg-brand-50 text-brand-700" />
                <Badge value={r.sentiment} />
                {!r.visibleToStudent && <Badge value="private" tone="bg-violet-100 text-violet-700" />}
                <span className="ml-auto"><Stars value={r.rating} /></span>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        title={editing ? 'Edit remark' : 'Add mentor remark'}
        onClose={() => setModalOpen(false)}
        footer={
          <>
            <button type="button" className="btn-secondary" onClick={() => setModalOpen(false)} disabled={saving}>Cancel</button>
            <button type="submit" form="remark-form" className="btn-primary" disabled={saving}>
              {saving && <Spinner className="h-4 w-4" />} {editing ? 'Save changes' : 'Add remark'}
            </button>
          </>
        }
      >
        <form id="remark-form" onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
          <Field label="Category" error={errors.category} required>
            <Select value={form.category} error={errors.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {REMARK_CATEGORIES.map((c) => <option key={c} value={c}>{titleCase(c)}</option>)}
            </Select>
          </Field>
          <Field label="Sentiment">
            <Select value={form.sentiment} onChange={(e) => setForm({ ...form, sentiment: e.target.value })}>
              {SENTIMENTS.map((c) => <option key={c} value={c}>{titleCase(c)}</option>)}
            </Select>
          </Field>
          <Field label="Remark" error={errors.remark} required className="sm:col-span-2">
            <TextArea rows={4} value={form.remark} error={errors.remark} onChange={(e) => setForm({ ...form, remark: e.target.value })} placeholder="Observation about the student's progress, conduct or achievement" />
          </Field>
          <Field label="Rating" hint="1 = needs attention, 5 = excellent">
            <Select value={form.rating} onChange={(e) => setForm({ ...form, rating: e.target.value })}>
              {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}</option>)}
            </Select>
          </Field>
          <Field label="Date">
            <TextInput type="date" value={form.remarkDate} onChange={(e) => setForm({ ...form, remarkDate: e.target.value })} />
          </Field>
          <div className="sm:col-span-2">
            <Checkbox
              label="Visible to the student"
              checked={form.visibleToStudent}
              onChange={(e) => setForm({ ...form, visibleToStudent: e.target.checked })}
            />
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete remark"
        message="This will permanently remove the remark."
        confirmLabel="Delete"
        loading={deletingBusy}
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
};

export default RemarkPanel;
