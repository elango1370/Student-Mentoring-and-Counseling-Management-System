import { useCallback, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { mentorApi } from '../api/endpoints.js';
import { useApi } from '../hooks/useApi.js';
import { useToast } from '../context/ToastContext.jsx';
import PageHeader from '../components/PageHeader.jsx';
import SearchBar from '../components/SearchBar.jsx';
import Avatar from '../components/Avatar.jsx';
import { Checkbox, Select } from '../components/Field.jsx';
import { EmptyState, ErrorState, LoadingState, Spinner } from '../components/States.jsx';
import { SEMESTERS } from '../utils/constants.js';

const ChooseStudents = () => {
  const toast = useToast();
  const [filters, setFilters] = useState({ search: '', department: '', year: '', section: '', semester: '' });
  const [selected, setSelected] = useState([]);
  const [busy, setBusy] = useState(false);

  const fetcher = useCallback(() => mentorApi.availableStudents(filters), [filters]);
  const { data, loading, error, refetch } = useApi(fetcher, [
    filters.search, filters.department, filters.year, filters.section, filters.semester,
  ]);

  const students = data?.data || [];
  const facets = data?.facets || { departments: [], years: [], sections: [] };
  const capacity = data?.capacity || { current: 0, max: 0, remaining: 0 };

  const setFilter = (patch) => setFilters((f) => ({ ...f, ...patch }));

  // Segregate: Department → Year → Section
  const groups = useMemo(() => {
    const map = new Map();
    students.forEach((s) => {
      const key = `${s.department}|${s.year}|${s.section}`;
      if (!map.has(key)) map.set(key, { key, department: s.department, year: s.year, section: s.section, students: [] });
      map.get(key).students.push(s);
    });
    return Array.from(map.values());
  }, [students]);

  const toggle = (id) => setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  const toggleGroup = (group) => {
    const ids = group.students.map((s) => s._id);
    const all = ids.every((id) => selected.includes(id));
    setSelected((prev) => (all ? prev.filter((id) => !ids.includes(id)) : Array.from(new Set([...prev, ...ids]))));
  };

  const overLimit = selected.length > capacity.remaining;

  const claim = async () => {
    if (selected.length === 0) return;
    setBusy(true);
    try {
      const res = await mentorApi.claimStudents(selected);
      toast.success(res.message);
      setSelected([]);
      refetch();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Choose students to mentor"
        subtitle="Unassigned students, grouped by department, year and section."
        actions={<Link to="/my-students" className="btn-secondary">View my students</Link>}
      />

      <div className="mb-5 grid gap-4 lg:grid-cols-4">
        <div className="card card-pad lg:col-span-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <SearchBar value={filters.search} onChange={(v) => setFilter({ search: v })} placeholder="Search name or roll number…" className="sm:max-w-xs" />
            <Select value={filters.department} onChange={(e) => setFilter({ department: e.target.value })} className="sm:w-48" aria-label="Filter by department">
              <option value="">All departments</option>
              {facets.departments.map((d) => <option key={d} value={d}>{d}</option>)}
            </Select>
            <Select value={filters.year} onChange={(e) => setFilter({ year: e.target.value })} className="sm:w-32" aria-label="Filter by year">
              <option value="">All years</option>
              {facets.years.map((y) => <option key={y} value={y}>Year {y}</option>)}
            </Select>
            <Select value={filters.section} onChange={(e) => setFilter({ section: e.target.value })} className="sm:w-36" aria-label="Filter by section">
              <option value="">All sections</option>
              {facets.sections.map((s) => <option key={s} value={s}>Section {s}</option>)}
            </Select>
            <Select value={filters.semester} onChange={(e) => setFilter({ semester: e.target.value })} className="sm:w-40" aria-label="Filter by semester">
              <option value="">All semesters</option>
              {SEMESTERS.map((s) => <option key={s} value={s}>Semester {s}</option>)}
            </Select>
          </div>
        </div>
        <div className="card card-pad">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">Your mentee slots</p>
          <p className="mt-2 text-3xl font-bold text-ink-900">{capacity.current}<span className="text-lg text-ink-400"> / {capacity.max}</span></p>
          <p className="mt-1 text-xs text-ink-500">{capacity.remaining} slot(s) left</p>
        </div>
      </div>

      <div className="card card-pad mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-ink-700">
          <span className="font-semibold">{selected.length}</span> selected
          {overLimit && <span className="ml-2 font-medium text-red-600">— more than your {capacity.remaining} remaining slot(s)</span>}
        </p>
        <div className="flex gap-2">
          <button type="button" className="btn-secondary" disabled={busy || selected.length === 0} onClick={() => setSelected([])}>Clear</button>
          <button type="button" className="btn-primary" disabled={busy || selected.length === 0 || overLimit} onClick={claim}>
            {busy && <Spinner className="h-4 w-4" />} Mentor selected students
          </button>
        </div>
      </div>

      {loading ? (
        <LoadingState label="Loading students…" />
      ) : error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : groups.length === 0 ? (
        <EmptyState title="No unassigned students" message="Nothing matches these filters, or every student already has a mentor." />
      ) : (
        <div className="space-y-5">
          {groups.map((g) => {
            const allChecked = g.students.every((s) => selected.includes(s._id));
            return (
              <div key={g.key} className="card overflow-hidden">
                <div className="flex items-center justify-between border-b border-ink-100 bg-ink-50 px-4 py-3">
                  <div>
                    <p className="text-sm font-bold text-ink-900">{g.department}</p>
                    <p className="text-xs text-ink-500">Year {g.year} · Section {g.section} · {g.students.length} student(s)</p>
                  </div>
                  <Checkbox checked={allChecked} onChange={() => toggleGroup(g)} label="Select whole section" />
                </div>
                <ul className="divide-y divide-ink-100">
                  {g.students.map((s) => (
                    <li key={s._id} className={`flex items-center gap-3 px-4 py-2.5 ${selected.includes(s._id) ? 'bg-brand-50/60' : ''}`}>
                      <Checkbox checked={selected.includes(s._id)} onChange={() => toggle(s._id)} aria-label={`Select ${s.user?.name}`} />
                      <Avatar name={s.user?.name} color={s.user?.avatarColor} size="sm" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-ink-900">{s.user?.name}</p>
                        <p className="truncate text-xs text-ink-500">{s.rollNumber} · Semester {s.semester}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
          {students.length >= 500 && <p className="text-xs text-ink-500">Showing the first 500 matches — narrow the filters to see more.</p>}
        </div>
      )}
    </>
  );
};

export default ChooseStudents;
