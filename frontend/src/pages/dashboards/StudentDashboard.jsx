import { Link } from 'react-router-dom';
import { dashboardApi } from '../../api/endpoints.js';
import { useApi } from '../../hooks/useApi.js';
import PageHeader from '../../components/PageHeader.jsx';
import StatCard from '../../components/StatCard.jsx';
import Avatar from '../../components/Avatar.jsx';
import Badge from '../../components/Badge.jsx';
import { AreaChartCard, ChartCard, GaugeChart, LineChartCard, PieChartCard, ProgressBar } from '../../components/Charts.jsx';
import { EmptyState, ErrorState, LoadingState } from '../../components/States.jsx';
import { IconCalendar, IconChart, IconChat, IconShield } from '../../components/Icons.jsx';
import { formatDate, percentTone } from '../../utils/format.js';

const StudentDashboard = () => {
  const { data, loading, error, refetch } = useApi(dashboardApi.get, []);

  if (loading) return <LoadingState label="Loading your dashboard…" />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;

  const { student, stats = {}, charts = {}, recent = {} } = data?.data || {};
  const mentorUser = student?.mentor?.user;

  return (
    <>
      <PageHeader
        title="My dashboard"
        subtitle={`${student?.rollNumber || ''} · ${student?.department || ''} · Year ${student?.year || '—'}, Semester ${student?.semester || '—'}`}
      />

      {stats.attendancePercentage < 75 && (
        <div className="mb-5 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <IconCalendar className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          <div>
            <p className="text-sm font-semibold text-amber-900">Your attendance is below the 75% requirement</p>
            <p className="mt-0.5 text-sm text-amber-800">
              Speak with your mentor about a plan to bring it back up before the end of the semester.
            </p>
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Average marks" value={`${(stats.averageMarks ?? 0).toFixed(1)}%`} sublabel={`${stats.totalAssessments ?? 0} assessments`} icon={IconChart} tone={stats.averageMarks >= 60 ? 'emerald' : 'amber'} />
        <StatCard label="Attendance" value={`${(stats.attendancePercentage ?? 0).toFixed(1)}%`} sublabel={stats.attendanceStatus === 'good' ? 'Meets requirement' : 'Below requirement'} icon={IconCalendar} tone={stats.attendancePercentage >= 75 ? 'emerald' : 'red'} />
        <StatCard label="Counseling sessions" value={stats.totalSessions ?? 0} sublabel={`${stats.totalRemarks ?? 0} mentor remarks`} icon={IconChat} tone="sky" />
        <StatCard label="Interventions" value={stats.totalInterventions ?? 0} sublabel={`${stats.openInterventions ?? 0} currently open`} icon={IconShield} tone={stats.openInterventions > 0 ? 'amber' : 'emerald'} />
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        <ChartCard title="Attendance" subtitle="Overall percentage this academic period">
          <GaugeChart value={stats.attendancePercentage || 0} label="Required: 75%" />
        </ChartCard>
        <ChartCard title="Semester performance" subtitle="Average score per semester" className="lg:col-span-2">
          <LineChartCard data={charts.semesterPerformance || []} dataKey="percentage" unit="%" />
        </ChartCard>
        <ChartCard title="Attendance trend" subtitle="Last six months" className="lg:col-span-2">
          <AreaChartCard data={charts.attendanceTrend || []} />
        </ChartCard>
        <ChartCard title="Attendance breakdown" subtitle="How your entries are classified">
          <PieChartCard data={charts.attendanceBreakdown || []} />
        </ChartCard>
      </div>

      {(charts.attendanceBySubject || []).length > 0 && (
        <div className="card card-pad mt-5">
          <h3 className="mb-4 text-sm font-semibold text-ink-900">Attendance by subject</h3>
          <div className="space-y-3">
            {charts.attendanceBySubject.map((s) => (
              <div key={s.subjectCode} className="flex items-center gap-3">
                <div className="w-36 shrink-0">
                  <p className="truncate text-sm font-semibold text-ink-800">{s.subjectCode}</p>
                  <p className="truncate text-xs text-ink-500">{s.subjectName}</p>
                </div>
                <div className="flex-1"><ProgressBar value={s.percentage} /></div>
                <span className={`w-14 shrink-0 text-right text-sm font-semibold ${percentTone(s.percentage)}`}>
                  {s.percentage.toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        <div className="card card-pad">
          <h3 className="mb-4 text-sm font-semibold text-ink-900">My mentor</h3>
          {mentorUser ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Avatar name={mentorUser.name} color={mentorUser.avatarColor} size="lg" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-ink-900">{mentorUser.name}</p>
                  <p className="truncate text-xs text-ink-500">{student.mentor.designation}</p>
                </div>
              </div>
              <dl className="space-y-2 text-sm">
                {[
                  ['Department', student.mentor.department],
                  ['Email', mentorUser.email],
                  ['Phone', mentorUser.phone || '—'],
                  ['Office', student.mentor.officeLocation || '—'],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-3">
                    <dt className="text-ink-500">{k}</dt>
                    <dd className="truncate font-medium text-ink-800">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>
          ) : (
            <EmptyState title="No mentor assigned" message="Your administrator will assign a faculty mentor shortly." className="border-0 bg-transparent py-8 shadow-none" />
          )}
        </div>

        <div className="card card-pad lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-ink-900">Recent counseling sessions</h3>
            <Link to="/my-counseling" className="text-xs font-semibold text-brand-600 hover:text-brand-700">View all</Link>
          </div>
          {(recent.sessions || []).length === 0 ? (
            <EmptyState title="No sessions yet" message="Sessions with your mentor will appear here." className="border-0 bg-transparent py-8 shadow-none" />
          ) : (
            <ul className="divide-y divide-ink-100">
              {recent.sessions.map((s) => (
                <li key={s._id} className="flex items-center gap-3 py-3">
                  <Avatar name={s.mentor?.user?.name} color={s.mentor?.user?.avatarColor} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink-800">{s.title}</p>
                    <p className="truncate text-xs text-ink-500">{formatDate(s.sessionDate)} · {s.mentor?.user?.name}</p>
                  </div>
                  <Badge value={s.sessionType} tone="bg-brand-50 text-brand-700" className="shrink-0" />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <div className="card card-pad">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-ink-900">Latest mentor remarks</h3>
            <Link to="/my-remarks" className="text-xs font-semibold text-brand-600 hover:text-brand-700">View all</Link>
          </div>
          {(recent.remarks || []).length === 0 ? (
            <EmptyState title="No remarks yet" className="border-0 bg-transparent py-8 shadow-none" />
          ) : (
            <ul className="space-y-3">
              {recent.remarks.map((r) => (
                <li key={r._id} className="rounded-lg border border-ink-200 p-3">
                  <div className="mb-1.5 flex items-center gap-2">
                    <Badge value={r.category} tone="bg-brand-50 text-brand-700" />
                    <Badge value={r.sentiment} />
                    <span className="ml-auto text-xs text-ink-500">{formatDate(r.remarkDate)}</span>
                  </div>
                  <p className="line-clamp-2 text-sm text-ink-700">{r.remark}</p>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card card-pad">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-ink-900">Intervention history</h3>
            <Link to="/my-interventions" className="text-xs font-semibold text-brand-600 hover:text-brand-700">View all</Link>
          </div>
          {(recent.interventions || []).length === 0 ? (
            <EmptyState title="No interventions" message="No support actions have been recorded." className="border-0 bg-transparent py-8 shadow-none" />
          ) : (
            <ul className="space-y-3">
              {recent.interventions.map((i) => (
                <li key={i._id} className="rounded-lg border border-ink-200 p-3">
                  <div className="mb-1.5 flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-ink-900">{i.title}</p>
                    <Badge value={i.status} />
                    <Badge value={i.priority} />
                  </div>
                  <p className="text-xs text-ink-500">Started {formatDate(i.startDate)}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
};

export default StudentDashboard;
