import { Link } from 'react-router-dom';
import { dashboardApi } from '../../api/endpoints.js';
import { useApi } from '../../hooks/useApi.js';
import PageHeader from '../../components/PageHeader.jsx';
import StatCard from '../../components/StatCard.jsx';
import Avatar from '../../components/Avatar.jsx';
import Badge from '../../components/Badge.jsx';
import { AreaChartCard, BarChartCard, ChartCard, LineChartCard, PieChartCard, ProgressBar } from '../../components/Charts.jsx';
import { EmptyState, ErrorState, LoadingState } from '../../components/States.jsx';
import { IconCalendar, IconChat, IconMentor, IconShield, IconUsers } from '../../components/Icons.jsx';
import { formatDate, percentTone } from '../../utils/format.js';

const AdminDashboard = () => {
  const { data, loading, error, refetch } = useApi(dashboardApi.get, []);

  if (loading) return <LoadingState label="Loading dashboard…" />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;

  const { stats = {}, charts = {}, recent = {} } = data?.data || {};
  const assignedPct = stats.totalStudents ? (stats.assignedStudents / stats.totalStudents) * 100 : 0;

  return (
    <>
      <PageHeader
        title="Administrator dashboard"
        subtitle="Institution-wide mentoring and counseling activity"
        actions={
          <>
            <Link to="/students" className="btn-secondary">Manage students</Link>
            <Link to="/assignments" className="btn-primary">Assign mentors</Link>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total students" value={stats.totalStudents ?? 0} sublabel={`${stats.activeStudents ?? 0} active`} icon={IconUsers} tone="brand" />
        <StatCard label="Faculty mentors" value={stats.totalMentors ?? 0} sublabel={`${stats.unassignedStudents ?? 0} students unassigned`} icon={IconMentor} tone="violet" />
        <StatCard label="Counseling sessions" value={stats.totalSessions ?? 0} sublabel={`${stats.totalRemarks ?? 0} mentor remarks`} icon={IconChat} tone="sky" />
        <StatCard label="Open interventions" value={stats.openInterventions ?? 0} sublabel={`${stats.totalInterventions ?? 0} total recorded`} icon={IconShield} tone={stats.openInterventions > 0 ? 'amber' : 'emerald'} />
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <div className="card card-pad">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">Mentor coverage</p>
          <div className="mt-2 flex items-baseline gap-2">
            <p className="text-2xl font-bold text-ink-900">{assignedPct.toFixed(0)}%</p>
            <p className="text-xs text-ink-500">{stats.assignedStudents ?? 0} of {stats.totalStudents ?? 0} assigned</p>
          </div>
          <div className="mt-3"><ProgressBar value={assignedPct} /></div>
        </div>
        <div className="card card-pad">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">Average attendance</p>
          <p className={`mt-2 text-2xl font-bold ${percentTone(stats.averageAttendance || 0)}`}>
            {(stats.averageAttendance || 0).toFixed(1)}%
          </p>
          <div className="mt-3"><ProgressBar value={stats.averageAttendance || 0} /></div>
        </div>
        <div className="card card-pad">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">Average marks</p>
          <p className={`mt-2 text-2xl font-bold ${percentTone(stats.averageMarks || 0)}`}>
            {(stats.averageMarks || 0).toFixed(1)}%
          </p>
          <div className="mt-3"><ProgressBar value={stats.averageMarks || 0} /></div>
        </div>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <ChartCard title="Students by department" subtitle="Current enrolment distribution">
          <BarChartCard data={charts.byDepartment || []} color="multi" />
        </ChartCard>
        <ChartCard title="Students by year" subtitle="Cohort sizes across the programme">
          <BarChartCard data={charts.byYear || []} />
        </ChartCard>
        <ChartCard title="Counseling sessions" subtitle="Sessions recorded over the last six months">
          <LineChartCard data={charts.sessionsTrend || []} />
        </ChartCard>
        <ChartCard title="Attendance trend" subtitle="Institution-wide monthly attendance">
          <AreaChartCard data={charts.attendanceTrend || []} />
        </ChartCard>
        <ChartCard title="Session types" subtitle="What students are being counselled about">
          <PieChartCard data={charts.sessionTypes || []} />
        </ChartCard>
        <ChartCard title="Mentor workload" subtitle="Students assigned per mentor">
          {(charts.mentorLoad || []).length === 0 ? (
            <EmptyState title="No assignments yet" message="Assign students to mentors to see workload here." className="border-0 bg-transparent py-8 shadow-none" />
          ) : (
            <ul className="space-y-3">
              {charts.mentorLoad.map((m) => (
                <li key={m.mentorId} className="flex items-center gap-3">
                  <Avatar name={m.name} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink-800">{m.name}</p>
                    <p className="truncate text-xs text-ink-500">{m.department}</p>
                  </div>
                  <span className="badge bg-brand-50 text-brand-700">{m.count}</span>
                </li>
              ))}
            </ul>
          )}
        </ChartCard>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <div className="card card-pad">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-ink-900">
            <IconChat className="h-4 w-4 text-brand-600" /> Recent counseling sessions
          </h3>
          {(recent.sessions || []).length === 0 ? (
            <EmptyState title="No sessions yet" message="Mentor activity will appear here." className="border-0 bg-transparent py-8 shadow-none" />
          ) : (
            <ul className="divide-y divide-ink-100">
              {recent.sessions.map((s) => (
                <li key={s._id} className="flex items-center gap-3 py-3">
                  <Avatar name={s.student?.user?.name} color={s.student?.user?.avatarColor} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink-800">{s.title}</p>
                    <p className="truncate text-xs text-ink-500">
                      {s.student?.user?.name} · {s.student?.rollNumber} · {s.mentor?.user?.name}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs text-ink-500">{formatDate(s.sessionDate)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card card-pad">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-ink-900">
            <IconCalendar className="h-4 w-4 text-brand-600" /> Recent interventions
          </h3>
          {(recent.interventions || []).length === 0 ? (
            <EmptyState title="No interventions yet" message="Support actions will appear here." className="border-0 bg-transparent py-8 shadow-none" />
          ) : (
            <ul className="divide-y divide-ink-100">
              {recent.interventions.map((i) => (
                <li key={i._id} className="flex items-center gap-3 py-3">
                  <Avatar name={i.student?.user?.name} color={i.student?.user?.avatarColor} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink-800">{i.title}</p>
                    <p className="truncate text-xs text-ink-500">
                      {i.student?.user?.name} · {i.student?.rollNumber}
                    </p>
                  </div>
                  <Badge value={i.status} className="shrink-0" />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
};

export default AdminDashboard;
