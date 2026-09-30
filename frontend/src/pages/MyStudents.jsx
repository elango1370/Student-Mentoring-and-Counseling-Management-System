import { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import { mentorApi } from '../api/endpoints.js';
import { useToast } from '../context/ToastContext.jsx';
import { useApi } from '../hooks/useApi.js';
import PageHeader from '../components/PageHeader.jsx';
import SearchBar from '../components/SearchBar.jsx';
import Avatar from '../components/Avatar.jsx';
import Badge from '../components/Badge.jsx';
import { Select } from '../components/Field.jsx';
import { EmptyState, ErrorState, LoadingState } from '../components/States.jsx';
import { IconChat, IconNote, IconShield } from '../components/Icons.jsx';
import { SEMESTERS, YEARS } from '../utils/constants.js';

const MyStudents = () => {
  const toast = useToast();
  const [filters, setFilters] = useState({ search: '', year: '', section: '', semester: '' });

  const fetcher = useCallback(() => mentorApi.myStudents(filters), [filters]);
  const { data, loading, error, refetch } = useApi(fetcher, [filters.search, filters.year, filters.section, filters.semester]);

  const students = data?.data || [];
  const setFilter = (patch) => setFilters((f) => ({ ...f, ...patch }));
  const sections = Array.from(new Set(students.map((s) => s.section).filter(Boolean))).sort();

  const release = async (e, student) => {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm(`Stop mentoring ${student.user?.name}? They will return to the unassigned pool.`)) return;
    try {
      const res = await mentorApi.releaseStudents([student._id]);
      toast.success(res.message);
      refetch();
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <>
      <PageHeader
        title="My students"
        subtitle={`${students.length} students assigned to you`}
        actions={<Link to="/choose-students" className="btn-primary">Choose more students</Link>}
      />

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchBar value={filters.search} onChange={(v) => setFilter({ search: v })} placeholder="Search name or roll number…" className="sm:max-w-xs" />
        <Select value={filters.year} onChange={(e) => setFilter({ year: e.target.value })} className="sm:w-32" aria-label="Filter by year">
          <option value="">All years</option>
          {YEARS.map((y) => <option key={y} value={y}>Year {y}</option>)}
        </Select>
        <Select value={filters.section} onChange={(e) => setFilter({ section: e.target.value })} className="sm:w-36" aria-label="Filter by section">
          <option value="">All sections</option>
          {sections.map((sec) => <option key={sec} value={sec}>Section {sec}</option>)}
        </Select>
        <Select value={filters.semester} onChange={(e) => setFilter({ semester: e.target.value })} className="sm:w-40" aria-label="Filter by semester">
          <option value="">All semesters</option>
          {SEMESTERS.map((s) => <option key={s} value={s}>Semester {s}</option>)}
        </Select>
      </div>

      {loading ? (
        <LoadingState label="Loading your students…" />
      ) : error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : students.length === 0 ? (
        <EmptyState title="No students assigned" message="Pick students to mentor from the unassigned list, or wait for the administrator to allocate some." action={<Link to="/choose-students" className="btn-primary btn-sm">Choose students</Link>} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {students.map((s) => (
            <Link key={s._id} to={`/students/${s._id}`} className="card card-pad flex flex-col gap-4 transition hover:shadow-pop">
              <div className="flex items-start gap-3">
                <Avatar name={s.user?.name} color={s.user?.avatarColor} size="lg" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-base font-semibold text-ink-900">{s.user?.name}</p>
                  <p className="truncate text-xs text-ink-500">{s.rollNumber} · {s.department}</p>
                  <p className="mt-1 text-xs text-ink-500">Year {s.year} · Semester {s.semester} · Section {s.section}</p>
                </div>
                <Badge value={s.status} />
              </div>

              <div className="grid grid-cols-3 gap-2 border-t border-ink-100 pt-3 text-center">
                <div>
                  <p className="flex items-center justify-center gap-1 text-[11px] font-medium text-ink-500"><IconChat className="h-3.5 w-3.5" /> Sessions</p>
                  <p className="mt-1 text-lg font-bold text-ink-900">{s.sessionCount}</p>
                </div>
                <div>
                  <p className="flex items-center justify-center gap-1 text-[11px] font-medium text-ink-500"><IconNote className="h-3.5 w-3.5" /> Remarks</p>
                  <p className="mt-1 text-lg font-bold text-ink-900">{s.remarkCount}</p>
                </div>
                <div>
                  <p className="flex items-center justify-center gap-1 text-[11px] font-medium text-ink-500"><IconShield className="h-3.5 w-3.5" /> Open</p>
                  <p className={`mt-1 text-lg font-bold ${s.openInterventions > 0 ? 'text-amber-600' : 'text-ink-900'}`}>{s.openInterventions}</p>
                </div>
              </div>
              <button type="button" onClick={(e) => release(e, s)} className="self-end text-xs font-medium text-ink-500 hover:text-red-600">Release student</button>
            </Link>
          ))}
        </div>
      )}
    </>
  );
};

export default MyStudents;
