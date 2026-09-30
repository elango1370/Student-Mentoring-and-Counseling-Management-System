import { useCallback, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { studentApi } from '../api/endpoints.js';
import { useApi } from '../hooks/useApi.js';
import { useAuth } from '../context/AuthContext.jsx';
import PageHeader from '../components/PageHeader.jsx';
import Avatar from '../components/Avatar.jsx';
import Badge from '../components/Badge.jsx';
import StatCard from '../components/StatCard.jsx';
import { AreaChartCard, BarChartCard, ChartCard, GaugeChart } from '../components/Charts.jsx';
import { EmptyState, ErrorState, LoadingState } from '../components/States.jsx';
import {
  IconBack, IconCalendar, IconChart, IconChat, IconNote, IconShield, IconUser,
} from '../components/Icons.jsx';
import AcademicPanel from '../components/records/AcademicPanel.jsx';
import AttendancePanel from '../components/records/AttendancePanel.jsx';
import CounselingPanel from '../components/records/CounselingPanel.jsx';
import RemarkPanel from '../components/records/RemarkPanel.jsx';
import InterventionPanel from '../components/records/InterventionPanel.jsx';
import { formatDate, titleCase } from '../utils/format.js';

const TABS = [
  { key: 'overview', label: 'Overview', icon: IconUser },
  { key: 'academics', label: 'Academics', icon: IconChart },
  { key: 'attendance', label: 'Attendance', icon: IconCalendar },
  { key: 'counseling', label: 'Counseling', icon: IconChat },
  { key: 'remarks', label: 'Remarks', icon: IconNote },
  { key: 'interventions', label: 'Interventions', icon: IconShield },
];

const RISK_TONE = { low: 'bg-emerald-100 text-emerald-700', medium: 'bg-amber-100 text-amber-700', high: 'bg-red-100 text-red-700' };

const DetailRow = ({ label, value }) => (
  <div className="flex items-start justify-between gap-4 border-b border-ink-100 py-2.5 last:border-0">
    <dt className="text-xs font-medium text-ink-500">{label}</dt>
    <dd className="text-right text-sm font-semibold text-ink-800">{value || '—'}</dd>
  </div>
);

const StudentDetail = () => {
  const { id } = useParams();
  const { role } = useAuth();
  const [tab, setTab] = useState('overview');

  const fetcher = useCallback(() => studentApi.overview(id), [id]);
  const { data, loading, error, refetch } = useApi(fetcher, [id]);

  const overview = data?.data;
  const student = overview?.student;
  const isMentor = role === 'mentor';
  const isStaff = role === 'mentor' || role === 'admin';

  if (loading) return <LoadingState label="Loading student profile…" />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;
  if (!overview) return <EmptyState title="Student not found" message="This student record is unavailable." />;

  const backTo = isMentor ? '/my-students' : '/students';

  return (
    <>
      <PageHeader
        breadcrumb={
          <Link to={backTo} className="mb-2 inline-flex items-center gap-1.5 text-xs font-semibold text-brand-700 hover:text-brand-800">
            <IconBack className="h-4 w-4" /> Back to students
          </Link>
        }
        title={student?.user?.name || 'Student'}
        subtitle={`${student?.rollNumber} · ${student?.department} · Year ${student?.year} · Semester ${student?.semester}`}
        actions={<span className={`badge ${RISK_TONE[overview.risk.level]}`}>{titleCase(overview.risk.level)} risk</span>}
      />

      <div className="mb-6 flex gap-1 overflow-x-auto rounded-xl border border-ink-200 bg-white p-1.5">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`flex shrink-0 items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition ${
              tab === key ? 'bg-brand-600 text-white shadow-card' : 'text-ink-600 hover:bg-ink-100'
            }`}
          >
            <Icon className="h-4 w-4" /> {label}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Average marks" value={`${overview.academics.averagePercentage}%`} sublabel={`${overview.academics.totalRecords} assessments`} icon={IconChart} tone="brand" />
            <StatCard label="Attendance" value={`${overview.attendance.percentage}%`} sublabel={`${overview.attendance.attendedPeriods}/${overview.attendance.totalPeriods} periods`} icon={IconCalendar} tone={overview.attendance.status === 'critical' ? 'red' : overview.attendance.status === 'warning' ? 'amber' : 'emerald'} />
            <StatCard label="Counseling sessions" value={overview.counseling.total} sublabel={`${overview.remarks.total} mentor remarks`} icon={IconChat} tone="sky" />
            <StatCard label="Open interventions" value={overview.interventions.open} sublabel={`${overview.interventions.total} total recorded`} icon={IconShield} tone={overview.interventions.open > 0 ? 'amber' : 'violet'} />
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <div className="card card-pad lg:col-span-1">
              <div className="flex items-center gap-4">
                <Avatar name={student?.user?.name} color={student?.user?.avatarColor} size="xl" />
                <div className="min-w-0">
                  <p className="truncate text-lg font-bold text-ink-900">{student?.user?.name}</p>
                  <p className="truncate text-sm text-ink-500">{student?.user?.email}</p>
                  <div className="mt-2"><Badge value={student?.status} /></div>
                </div>
              </div>
              <dl className="mt-5">
                <DetailRow label="Roll number" value={student?.rollNumber} />
                <DetailRow label="Register number" value={student?.registerNumber} />
                <DetailRow label="Programme" value={student?.program} />
                <DetailRow label="Section" value={student?.section} />
                <DetailRow label="Phone" value={student?.user?.phone} />
                <DetailRow label="Date of birth" value={formatDate(student?.dateOfBirth)} />
                <DetailRow label="Gender" value={student?.gender ? titleCase(student.gender) : ''} />
                <DetailRow label="Blood group" value={student?.bloodGroup} />
                <DetailRow label="Guardian" value={student?.guardianName} />
                <DetailRow label="Guardian phone" value={student?.guardianPhone} />
                <DetailRow label="Hostel resident" value={student?.hostelResident ? 'Yes' : 'No'} />
                <DetailRow label="Address" value={student?.address} />
              </dl>
            </div>

            <div className="space-y-4 lg:col-span-2">
              <div className="grid gap-4 sm:grid-cols-2">
                <ChartCard title="Attendance rate" subtitle="Excused periods excluded">
                  <GaugeChart value={overview.attendance.percentage} label={`${overview.attendance.attendedPeriods} of ${overview.attendance.totalPeriods} periods`} />
                </ChartCard>
                <ChartCard title="Risk assessment" subtitle="Derived from marks, attendance and interventions">
                  <div className="py-2">
                    <span className={`badge ${RISK_TONE[overview.risk.level]}`}>{titleCase(overview.risk.level)} risk</span>
                    {overview.risk.factors.length === 0 ? (
                      <p className="mt-4 text-sm text-ink-500">No risk factors detected. This student is progressing well.</p>
                    ) : (
                      <ul className="mt-4 space-y-2">
                        {overview.risk.factors.map((f) => (
                          <li key={f} className="flex items-start gap-2 text-sm text-ink-700">
                            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                            {f}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </ChartCard>
              </div>

              <ChartCard title="Semester performance" subtitle="Average percentage per semester">
                <BarChartCard data={overview.academics.semesterPerformance} dataKey="percentage" nameKey="label" />
              </ChartCard>

              <ChartCard title="Attendance trend" subtitle="Last six months">
                <AreaChartCard data={overview.attendance.trend} dataKey="percentage" nameKey="label" />
              </ChartCard>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <div className="card card-pad">
              <h3 className="text-sm font-semibold text-ink-900">Recent counseling</h3>
              {overview.counseling.recent.length === 0 ? (
                <p className="mt-3 text-sm text-ink-500">No counseling sessions recorded.</p>
              ) : (
                <ul className="mt-3 space-y-3">
                  {overview.counseling.recent.map((s) => (
                    <li key={s._id} className="border-b border-ink-100 pb-3 last:border-0 last:pb-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-sm font-semibold text-ink-800">{s.title}</p>
                        <Badge value={s.status} />
                      </div>
                      <p className="mt-1 text-xs text-ink-500">{formatDate(s.sessionDate)} · {titleCase(s.sessionType)} · {s.mentor?.user?.name}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="card card-pad">
              <h3 className="text-sm font-semibold text-ink-900">Recent remarks</h3>
              {overview.remarks.recent.length === 0 ? (
                <p className="mt-3 text-sm text-ink-500">No mentor remarks recorded.</p>
              ) : (
                <ul className="mt-3 space-y-3">
                  {overview.remarks.recent.map((r) => (
                    <li key={r._id} className="border-b border-ink-100 pb-3 last:border-0 last:pb-0">
                      <div className="flex items-center justify-between gap-2">
                        <Badge value={r.sentiment} />
                        <span className="text-xs text-ink-500">{formatDate(r.remarkDate)}</span>
                      </div>
                      <p className="mt-1.5 line-clamp-2 text-sm text-ink-700">{r.remark}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="card card-pad">
              <h3 className="text-sm font-semibold text-ink-900">Recent interventions</h3>
              {overview.interventions.recent.length === 0 ? (
                <p className="mt-3 text-sm text-ink-500">No interventions recorded.</p>
              ) : (
                <ul className="mt-3 space-y-3">
                  {overview.interventions.recent.map((i) => (
                    <li key={i._id} className="border-b border-ink-100 pb-3 last:border-0 last:pb-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-sm font-semibold text-ink-800">{i.title}</p>
                        <Badge value={i.status} />
                      </div>
                      <p className="mt-1 text-xs text-ink-500">{formatDate(i.startDate)} · {titleCase(i.interventionType)}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      {tab === 'academics' && <AcademicPanel studentId={id} canEdit={isStaff} isAdmin={role === 'admin'} defaultSemester={student?.semester} />}
      {tab === 'attendance' && <AttendancePanel studentId={id} canEdit={isStaff} defaultSemester={student?.semester} />}
      {tab === 'counseling' && <CounselingPanel studentId={id} canEdit={isMentor} />}
      {tab === 'remarks' && <RemarkPanel studentId={id} canEdit={isMentor} />}
      {tab === 'interventions' && <InterventionPanel studentId={id} canEdit={isMentor} />}
    </>
  );
};

export default StudentDetail;
