import { useCallback, useMemo, useState } from 'react';
import { mentorApi, metaApi, studentApi } from '../api/endpoints.js';
import { useApi } from '../hooks/useApi.js';
import { useToast } from '../context/ToastContext.jsx';
import PageHeader from '../components/PageHeader.jsx';
import SearchBar from '../components/SearchBar.jsx';
import Pagination from '../components/Pagination.jsx';
import Avatar from '../components/Avatar.jsx';
import { Checkbox, Select } from '../components/Field.jsx';
import { EmptyState, ErrorState, LoadingState, Spinner } from '../components/States.jsx';
import { IconLink, IconShield } from '../components/Icons.jsx';
import { YEARS } from '../utils/constants.js';

const Assignments = () => {
  const toast = useToast();
  const [filters, setFilters] = useState({ search: '', department: '', year: '', mentor: '', unassigned: '', page: 1, limit: 15 });
  const [selected, setSelected] = useState([]);
  const [targetMentor, setTargetMentor] = useState('');
  const [busy, setBusy] = useState(false);

  const fetcher = useCallback(() => studentApi.list(filters), [filters]);
  const { data, loading, error, refetch } = useApi(fetcher, [
    filters.search, filters.department, filters.year, filters.mentor, filters.unassigned, filters.page,
  ]);
  const { data: mentorsData, refetch: refetchMentors } = useApi(() => mentorApi.list({ limit: 100 }), []);
  const { data: deptData } = useApi(metaApi.departments, []);

  const students = data?.data || [];
  const pagination = data?.pagination || {};
  const mentors = mentorsData?.data || [];
  const departments = deptData?.data || [];

  const unassignedCount = useMemo(() => students.filter((s) => !s.mentor).length, [students]);

  const setFilter = (patch) => {
    setSelected([]);
    setFilters((f) => ({ ...f, ...patch, page: patch.page ?? 1 }));
  };

  const toggle = (id) => setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  const allSelected = students.length > 0 && selected.length === students.length;
  const toggleAll = () => setSelected(allSelected ? [] : students.map((s) => s._id));

  const apply = async (mentorId) => {
    if (selected.length === 0) {
      toast.warning('Select at least one student first.');
      return;
    }
    setBusy(true);
    try {
      const res = await studentApi.assign({ studentIds: selected, mentorId: mentorId || null });
      toast.success(res.message || (mentorId ? 'Students assigned.' : 'Students unassigned.'));
      setSelected([]);
      setTargetMentor('');
      refetch();
      refetchMentors();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Student assignments"
        subtitle="Allocate students to mentors in bulk and rebalance mentee loads."
      />

      <div className="mb-5 grid gap-4 lg:grid-cols-4">
        <div className="card card-pad lg:col-span-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <SearchBar value={filters.search} onChange={(v) => setFilter({ search: v })} placeholder="Search name or roll number…" className="sm:max-w-xs" />
            <Select value={filters.department} onChange={(e) => setFilter({ department: e.target.value })} className="sm:w-48" aria-label="Filter by department">
              <option value="">All departments</option>
              {departments.map((d) => <option key={d} value={d}>{d}</option>)}
            </Select>
            <Select value={filters.year} onChange={(e) => setFilter({ year: e.target.value })} className="sm:w-32" aria-label="Filter by year">
              <option value="">All years</option>
              {YEARS.map((y) => <option key={y} value={y}>Year {y}</option>)}
            </Select>
            <Select
              value={filters.unassigned === 'true' ? 'unassigned' : filters.mentor || ''}
              onChange={(e) => {
                const v = e.target.value;
                if (v === 'unassigned') setFilter({ unassigned: 'true', mentor: '' });
                else setFilter({ unassigned: '', mentor: v });
              }}
              className="sm:w-56"
              aria-label="Filter by mentor"
            >
              <option value="">All mentors</option>
              <option value="unassigned">Unassigned only</option>
              {mentors.map((m) => <option key={m._id} value={m._id}>{m.user?.name}</option>)}
            </Select>
          </div>
        </div>

        <div className="card card-pad">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">Selected</p>
          <p className="mt-2 text-3xl font-bold text-ink-900">{selected.length}</p>
          <p className="mt-1 text-xs text-ink-500">{unassignedCount} unassigned on this page</p>
        </div>
      </div>

      <div className="card card-pad mb-5 flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label className="label">Assign selected students to</label>
          <Select value={targetMentor} onChange={(e) => setTargetMentor(e.target.value)}>
            <option value="">Choose a mentor…</option>
            {mentors.map((m) => (
              <option key={m._id} value={m._id}>
                {m.user?.name} · {m.department} ({m.studentCount}/{m.maxStudents})
              </option>
            ))}
          </Select>
        </div>
        <div className="flex gap-2">
          <button type="button" className="btn-primary" disabled={busy || !targetMentor || selected.length === 0} onClick={() => apply(targetMentor)}>
            {busy && <Spinner className="h-4 w-4" />} <IconLink className="h-4 w-4" /> Assign
          </button>
          <button type="button" className="btn-secondary" disabled={busy || selected.length === 0} onClick={() => apply(null)}>
            Unassign
          </button>
        </div>
      </div>

      {loading ? (
        <LoadingState label="Loading students…" />
      ) : error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : students.length === 0 ? (
        <EmptyState title="No students match these filters" message="Try a different department, year or mentor filter." />
      ) : (
        <div className="table-wrap">
          <table className="min-w-full divide-y divide-ink-200">
            <thead className="bg-ink-50">
              <tr>
                <th className="th w-10">
                  <Checkbox checked={allSelected} onChange={toggleAll} aria-label="Select all students" />
                </th>
                <th className="th">Student</th>
                <th className="th">Roll number</th>
                <th className="th">Department</th>
                <th className="th">Year / Sem</th>
                <th className="th">Current mentor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {students.map((s) => (
                <tr key={s._id} className={`transition ${selected.includes(s._id) ? 'bg-brand-50/60' : 'hover:bg-ink-50'}`}>
                  <td className="td">
                    <Checkbox checked={selected.includes(s._id)} onChange={() => toggle(s._id)} aria-label={`Select ${s.user?.name}`} />
                  </td>
                  <td className="td">
                    <div className="flex items-center gap-3">
                      <Avatar name={s.user?.name} color={s.user?.avatarColor} size="sm" />
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-ink-900">{s.user?.name}</p>
                        <p className="truncate text-xs text-ink-500">{s.user?.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="td font-medium">{s.rollNumber}</td>
                  <td className="td">{s.department}</td>
                  <td className="td">Year {s.year} · Sem {s.semester}</td>
                  <td className="td">
                    {s.mentor?.user?.name ? (
                      <span className="inline-flex items-center gap-1.5 text-ink-700">
                        <IconShield className="h-4 w-4 text-brand-600" /> {s.mentor.user.name}
                      </span>
                    ) : (
                      <span className="badge bg-amber-100 text-amber-700">Unassigned</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination {...pagination} onChange={(page) => { setSelected([]); setFilters((f) => ({ ...f, page })); }} />
        </div>
      )}
    </>
  );
};

export default Assignments;
