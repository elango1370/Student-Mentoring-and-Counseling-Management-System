import { Link } from 'react-router-dom';
import { dashboardApi } from '../../api/endpoints.js';
import { useApi } from '../../hooks/useApi.js';
import PageHeader from '../../components/PageHeader.jsx';
import StatCard from '../../components/StatCard.jsx';
import Avatar from '../../components/Avatar.jsx';
import Badge from '../../components/Badge.jsx';
import { AreaChartCard, ChartCard, LineChartCard, PieChartCard, ProgressBar } from '../../components/Charts.jsx';
import { EmptyState, ErrorState, LoadingState } from '../../components/States.jsx';
import { IconAlert, IconCalendar, IconChat, IconShield, IconUsers } from '../../components/Icons.jsx';
import { formatDate, percentTone } from '../../utils/format.js';

const MentorDashboard = () => {
  const { data, loading, error, refetch } = useApi(dashboardApi.get, []);

  if (loading) return <LoadingState label="Loading dashboard…" />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;

  const { stats = {}, charts = {}, studentPerformance = [], upcomingFollowUps = [] } = data?.data || {};
  const atRisk = studentPerformance.filter((s) => s.riskLevel !== 'low');

  return (
    <>
      <PageHeader
        title="Mentor dashboard"
        subtitle="Progress overview for the students assigned to you"
        actions={<Link to="/my-students" className="btn-primary">View my students</Link>}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Assigned students" value={stats.totalStudents ?? 0} sublabel={`${stats.atRiskStudents ?? 0} need attention`} icon={IconUsers} tone="brand" />
        <StatCard label="Counseling sessions" value={stats.totalSessions ?? 0} sublabel={`${stats.scheduledSessions ?? 0} scheduled`} icon={IconChat} tone="sky" />
        <StatCard label="Open interventions" value={stats.openInterventions ?? 0} sublabel={`${stats.criticalInterventions ?? 0} critical`} icon={IconShield} tone={stats.openInterventions > 0 ? 'amber' : 'emerald'} />
        <StatCard label="Average attendance" value={`${(stats.averageAttendance ?? 0).toFixed(1)}%`} sublabel="Across your cohort" icon={IconCalendar} tone={stats.averageAttendance >= 75 ? 'emerald' : 'red'} />
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        <ChartCard title="Sessions recorded" subtitle="Your counseling activity over six months" className="lg:col-span-2">
          <LineChartCard data={charts.sessionsTrend || []} />
        </ChartCard>
        <ChartCard title="Risk distribution" subtitle="Students by current risk level">
          <PieChartCard data={charts.riskDistribution || []} />
        </ChartCard>
        <ChartCard title="Cohort attendance" subtitle="Monthly percentage across your students" className="lg:col-span-2">
          <AreaChartCard data={charts.attendanceTrend || []} />
        </ChartCard>
        <ChartCard title="Session focus" subtitle="What you are counselling on">
          <PieChartCard data={charts.sessionTypes || []} />
        </ChartCard>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        <div className="card card-pad lg:col-span-2">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-ink-900">
            <IconAlert className="h-4 w-4 text-amber-500" /> Students needing attention
          </h3>
          {atRisk.length === 0 ? (
            <EmptyState title="Everyone is on track" message="No student currently meets the risk criteria." className="border-0 bg-transparent py-8 shadow-none" />
          ) : (
            <ul className="divide-y divide-ink-100">
              {atRisk.map((s) => (
                <li key={s.id} className="py-3">
                  <Link to={`/students/${s.id}`} className="flex items-center gap-3 rounded-lg p-1 transition hover:bg-ink-50">
                    <Avatar name={s.name} color={s.avatarColor} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-ink-900">{s.name}</p>
                      <p className="truncate text-xs text-ink-500">{s.rollNumber} · {s.riskFactors.join(', ')}</p>
                    </div>
                    <div className="hidden w-32 shrink-0 sm:block">
                      <div className="mb-1 flex items-center justify-between text-[11px] text-ink-500">
                        <span>Attendance</span>
                        <span className={percentTone(s.attendancePercentage)}>{s.attendancePercentage.toFixed(0)}%</span>
                      </div>
                      <ProgressBar value={s.attendancePercentage} />
                    </div>
                    <Badge value={s.riskLevel} tone={s.riskLevel === 'high' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'} className="shrink-0" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card card-pad">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-ink-900">
            <IconCalendar className="h-4 w-4 text-brand-600" /> Upcoming follow-ups
          </h3>
          {upcomingFollowUps.length === 0 ? (
            <EmptyState title="Nothing scheduled" message="Follow-ups you set will appear here." className="border-0 bg-transparent py-8 shadow-none" />
          ) : (
            <ul className="divide-y divide-ink-100">
              {upcomingFollowUps.map((f) => (
                <li key={f._id} className="flex items-center gap-3 py-3">
                  <Avatar name={f.student?.user?.name} color={f.student?.user?.avatarColor} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink-800">{f.student?.user?.name}</p>
                    <p className="truncate text-xs text-ink-500">{f.title}</p>
                  </div>
                  <span className="shrink-0 text-xs font-medium text-brand-600">{formatDate(f.followUpDate)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
};

export default MentorDashboard;
