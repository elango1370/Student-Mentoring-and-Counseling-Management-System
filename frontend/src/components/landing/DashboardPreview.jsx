import { useRef } from 'react';
import { motion, useInView, useReducedMotion } from 'framer-motion';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { CalendarCheck, GraduationCap, MessagesSquare, TriangleAlert, Users } from 'lucide-react';
import Reveal from './Reveal.jsx';
import SectionHeading from './SectionHeading.jsx';

/* Illustrative sample data: modest, realistic numbers for a single college. */

const STATS = [
  { label: 'Total Students', value: '186', note: 'Across 4 departments', icon: Users, tone: 'text-blue-300 bg-blue-500/15' },
  { label: 'Active Mentors', value: '14', note: 'About 13 students each', icon: GraduationCap, tone: 'text-violet-300 bg-violet-500/15' },
  { label: 'Attendance Rate', value: '87.4%', note: '+0.8% vs last week', icon: CalendarCheck, tone: 'text-teal-300 bg-teal-400/15' },
  { label: 'Counseling Sessions', value: '42', note: 'This month', icon: MessagesSquare, tone: 'text-sky-300 bg-sky-400/15' },
  { label: 'Students Requiring Attention', value: '9', note: '4.8% of all students', icon: TriangleAlert, tone: 'text-amber-300 bg-amber-400/15', attention: true },
];

const ATTENDANCE = [
  { week: 'Wk 1', rate: 84.1 },
  { week: 'Wk 2', rate: 85.3 },
  { week: 'Wk 3', rate: 83.9 },
  { week: 'Wk 4', rate: 86.2 },
  { week: 'Wk 5', rate: 86.6 },
  { week: 'Wk 6', rate: 87.4 },
];

const MARKS = [
  { exam: 'Internal 1', avg: 68 },
  { exam: 'Internal 2', avg: 72 },
  { exam: 'Internal 3', avg: 75 },
  { exam: 'Model', avg: 71 },
];

const SESSIONS = [
  { name: 'Academic', value: 18, color: '#60a5fa' },
  { name: 'Personal', value: 10, color: '#a78bfa' },
  { name: 'Career', value: 8, color: '#22d3ee' },
  { name: 'Attendance', value: 6, color: '#fbbf24' },
];

const ATTENTION = [
  { name: 'Arjun K.', reason: 'Attendance at 68%', level: 'High', chip: 'bg-red-400/15 text-red-300' },
  { name: 'Meera S.', reason: 'Internal 2 below pass mark', level: 'Medium', chip: 'bg-amber-400/15 text-amber-300' },
  { name: 'Rohan P.', reason: 'Two counseling sessions missed', level: 'Medium', chip: 'bg-amber-400/15 text-amber-300' },
  { name: 'Divya R.', reason: 'Attendance at 71%', level: 'Low', chip: 'bg-sky-400/15 text-sky-300' },
];

const AXIS = { fill: '#94a3b8', fontSize: 11 };
const TOOLTIP = {
  contentStyle: { background: '#0b1433', border: '1px solid rgba(255,255,255,0.14)', borderRadius: 10, fontSize: 12, color: '#e2e8f0' },
  labelStyle: { color: '#94a3b8' },
  itemStyle: { color: '#e2e8f0' },
  cursor: { stroke: 'rgba(255,255,255,0.2)', fill: 'rgba(255,255,255,0.05)' },
};

/** Panel that only mounts its chart once scrolled into view, so the chart's own animation is actually seen. */
const Panel = ({ title, subtitle, className = '', children }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  return (
    <div ref={ref} className={`min-w-0 rounded-xl border border-white/10 bg-navy-900/60 p-4 ${className}`}>
      <h3 className="font-display text-sm font-semibold text-white">{title}</h3>
      <p className="mt-0.5 text-xs text-slate-400">{subtitle}</p>
      <div className="mt-3">{typeof children === 'function' ? children(inView) : children}</div>
    </div>
  );
};

const DashboardPreview = () => {
  const reduced = Boolean(useReducedMotion());
  const animate = !reduced;

  return (
    <section className="relative scroll-mt-20 py-20 sm:py-28">
      <div className="lp-container">
        <SectionHeading title="See every student's progress at a glance">
          A sample of the dashboard that mentors and administrators use every day.
        </SectionHeading>

        <Reveal className="lp-glass mt-12 overflow-hidden" y={32}>
          <div className="flex items-center gap-3 border-b border-white/10 bg-white/[0.03] px-4 py-3">
            <span aria-hidden="true" className="flex gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-amber-400/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/70" />
            </span>
            <span className="text-xs font-medium text-slate-300">SMCMS · Admin overview</span>
            <span className="ml-auto rounded-full border border-white/10 px-2.5 py-0.5 text-[11px] text-slate-400">Sample data</span>
          </div>

          <div className="grid gap-4 p-4 sm:p-6">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
              {STATS.map((s, i) => {
                const Icon = s.icon;
                return (
                  <motion.div
                    key={s.label}
                    initial={{ opacity: 0, y: 14 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.45, delay: 0.1 + i * 0.07 }}
                    className={`rounded-xl border bg-navy-900/60 p-4 ${s.attention ? 'col-span-2 border-amber-300/25 md:col-span-1' : 'border-white/10'}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs leading-snug text-slate-400">{s.label}</p>
                      <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg ${s.tone}`}>
                        <Icon size={14} aria-hidden="true" />
                      </span>
                    </div>
                    <p className="mt-3 font-display text-2xl font-semibold text-white">{s.value}</p>
                    <p className="mt-1 text-xs text-slate-500">{s.note}</p>
                  </motion.div>
                );
              })}
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              <Panel title="Attendance trend" subtitle="Average attendance rate, last six weeks" className="lg:col-span-2">
                {(inView) => (
                  <div className="h-48">
                    {inView && (
                      <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                        <AreaChart data={ATTENDANCE} margin={{ top: 6, right: 8, left: -18, bottom: 0 }}>
                          <defs>
                            <linearGradient id="lpAttendanceFill" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.4} />
                              <stop offset="100%" stopColor="#22d3ee" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                          <XAxis dataKey="week" tick={AXIS} axisLine={false} tickLine={false} />
                          <YAxis domain={[80, 90]} ticks={[80, 85, 90]} tick={AXIS} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
                          <Tooltip {...TOOLTIP} formatter={(v) => [`${v}%`, 'Attendance']} />
                          <Area type="monotone" dataKey="rate" stroke="#22d3ee" strokeWidth={2.5} fill="url(#lpAttendanceFill)" isAnimationActive={animate} />
                        </AreaChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                )}
              </Panel>

              <Panel title="Counseling sessions" subtitle="By type, this month">
                {(inView) => (
                  <div className="flex h-48 items-center gap-3">
                    <div className="relative h-32 w-32 shrink-0">
                      {inView && (
                        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                          <PieChart>
                            <Pie data={SESSIONS} dataKey="value" innerRadius={40} outerRadius={60} paddingAngle={3} stroke="none" isAnimationActive={animate}>
                              {SESSIONS.map((s) => <Cell key={s.name} fill={s.color} />)}
                            </Pie>
                            <Tooltip {...TOOLTIP} />
                          </PieChart>
                        </ResponsiveContainer>
                      )}
                      <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
                        <span className="font-display text-lg font-semibold leading-none text-white">42<span className="mt-1 block text-[10px] font-normal text-slate-400">sessions</span></span>
                      </div>
                    </div>
                    <ul className="min-w-0 flex-1 space-y-2 text-xs">
                      {SESSIONS.map((s) => (
                        <li key={s.name} className="flex items-center justify-between gap-2 text-slate-300">
                          <span className="flex items-center gap-2 truncate">
                            <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: s.color }} aria-hidden="true" />
                            {s.name}
                          </span>
                          <span className="text-slate-400">{s.value}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </Panel>

              <Panel title="Average marks" subtitle="Across all departments">
                {(inView) => (
                  <div className="h-48">
                    {inView && (
                      <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                        <BarChart data={MARKS} margin={{ top: 6, right: 4, left: -22, bottom: 0 }}>
                          <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                          <XAxis dataKey="exam" tick={AXIS} axisLine={false} tickLine={false} interval={0} tickFormatter={(v) => v.replace('Internal ', 'Int ')} />
                          <YAxis domain={[0, 100]} tick={AXIS} axisLine={false} tickLine={false} />
                          <Tooltip {...TOOLTIP} formatter={(v) => [`${v}%`, 'Average']} />
                          <Bar dataKey="avg" fill="#60a5fa" radius={[6, 6, 0, 0]} maxBarSize={30} isAnimationActive={animate} />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                )}
              </Panel>

              <Panel title="Students requiring attention" subtitle="Flagged by attendance, marks or missed sessions" className="lg:col-span-2">
                <ul className="divide-y divide-white/5">
                  {ATTENTION.map((student) => (
                    <li key={student.name} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/10 text-xs font-semibold text-slate-200" aria-hidden="true">
                        {student.name.split(' ').map((p) => p[0]).join('')}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-white">{student.name}</p>
                        <p className="truncate text-xs text-slate-400">{student.reason}</p>
                      </div>
                      <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${student.chip}`}>{student.level}</span>
                    </li>
                  ))}
                </ul>
              </Panel>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
};

export default DashboardPreview;
