import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart,
  Pie, PieChart, PolarAngleAxis, RadialBar, RadialBarChart, ResponsiveContainer,
  Tooltip, XAxis, YAxis,
} from 'recharts';
import { CHART_COLORS } from '../utils/constants.js';
import { EmptyState } from './States.jsx';
import { titleCase } from '../utils/format.js';

const axisStyle = { fontSize: 11, fill: '#64748b' };
const tooltipStyle = {
  borderRadius: 10,
  border: '1px solid #e2e8f0',
  boxShadow: '0 10px 30px -15px rgba(15,23,42,.4)',
  fontSize: 12,
};

export const ChartCard = ({ title, subtitle, children, action, className = '' }) => (
  <div className={`card card-pad ${className}`}>
    <div className="mb-4 flex items-start justify-between gap-3">
      <div>
        <h3 className="text-sm font-semibold text-ink-900">{title}</h3>
        {subtitle && <p className="mt-0.5 text-xs text-ink-500">{subtitle}</p>}
      </div>
      {action}
    </div>
    {children}
  </div>
);

const NoData = ({ message = 'No data to display yet.' }) => (
  <EmptyState title="No chart data" message={message} className="border-0 bg-transparent py-10 shadow-none" />
);

export const BarChartCard = ({ data = [], dataKey = 'count', nameKey = 'label', height = 260, color = CHART_COLORS[0] }) => {
  if (!data.length) return <NoData />;
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
        <XAxis dataKey={nameKey} tick={axisStyle} tickLine={false} axisLine={false} interval={0} angle={data.length > 5 ? -18 : 0} textAnchor={data.length > 5 ? 'end' : 'middle'} height={data.length > 5 ? 52 : 30} tickFormatter={titleCase} />
        <YAxis tick={axisStyle} tickLine={false} axisLine={false} allowDecimals={false} />
        <Tooltip contentStyle={tooltipStyle} cursor={{ fill: '#f8fafc' }} />
        <Bar dataKey={dataKey} radius={[6, 6, 0, 0]} maxBarSize={48}>
          {data.map((entry, i) => (
            <Cell key={entry[nameKey] ?? i} fill={color === 'multi' ? CHART_COLORS[i % CHART_COLORS.length] : color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};

export const LineChartCard = ({ data = [], dataKey = 'count', nameKey = 'label', height = 260, color = CHART_COLORS[0], unit = '' }) => {
  if (!data.length) return <NoData />;
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
        <XAxis dataKey={nameKey} tick={axisStyle} tickLine={false} axisLine={false} />
        <YAxis tick={axisStyle} tickLine={false} axisLine={false} unit={unit} />
        <Tooltip contentStyle={tooltipStyle} />
        <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2.5} dot={{ r: 3, fill: color }} activeDot={{ r: 5 }} />
      </LineChart>
    </ResponsiveContainer>
  );
};

export const AreaChartCard = ({ data = [], dataKey = 'percentage', nameKey = 'label', height = 260, color = CHART_COLORS[2] }) => {
  if (!data.length) return <NoData />;
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
        <defs>
          <linearGradient id={`grad-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.35} />
            <stop offset="95%" stopColor={color} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
        <XAxis dataKey={nameKey} tick={axisStyle} tickLine={false} axisLine={false} />
        <YAxis tick={axisStyle} tickLine={false} axisLine={false} domain={[0, 100]} unit="%" />
        <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v}%`, 'Attendance']} />
        <Area type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2.5} fill={`url(#grad-${dataKey})`} />
      </AreaChart>
    </ResponsiveContainer>
  );
};

export const PieChartCard = ({ data = [], dataKey = 'count', nameKey = 'label', height = 260 }) => {
  const filtered = data.filter((d) => Number(d[dataKey]) > 0);
  if (!filtered.length) return <NoData />;
  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={filtered}
          dataKey={dataKey}
          nameKey={nameKey}
          innerRadius="52%"
          outerRadius="80%"
          paddingAngle={2}
        >
          {filtered.map((entry, i) => (
            <Cell key={entry[nameKey] ?? i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip contentStyle={tooltipStyle} formatter={(v, n) => [v, titleCase(n)]} />
        <Legend
          verticalAlign="bottom"
          height={36}
          iconType="circle"
          iconSize={8}
          formatter={(v) => <span className="text-xs text-ink-600">{titleCase(v)}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  );
};

export const GaugeChart = ({ value = 0, label = '', height = 210, color }) => {
  const tone = color || (value >= 75 ? '#059669' : value >= 65 ? '#d97706' : '#dc2626');
  return (
    <div className="relative" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart
          innerRadius="70%"
          outerRadius="100%"
          data={[{ name: label, value: Math.min(100, Math.max(0, value)) }]}
          startAngle={210}
          endAngle={-30}
        >
          <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
          <RadialBar background={{ fill: '#f1f5f9' }} dataKey="value" cornerRadius={20} fill={tone} />
        </RadialBarChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center pt-4">
        <span className="text-3xl font-bold" style={{ color: tone }}>
          {Number(value).toFixed(1)}%
        </span>
        {label && <span className="mt-0.5 text-xs font-medium text-ink-500">{label}</span>}
      </div>
    </div>
  );
};

export const ProgressBar = ({ value = 0, tone }) => {
  const v = Math.min(100, Math.max(0, Number(value) || 0));
  const color = tone || (v >= 75 ? 'bg-emerald-500' : v >= 60 ? 'bg-amber-500' : 'bg-red-500');
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-ink-200">
      <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${v}%` }} />
    </div>
  );
};
