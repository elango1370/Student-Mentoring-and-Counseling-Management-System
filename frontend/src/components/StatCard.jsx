const TONES = {
  brand: 'bg-brand-50 text-brand-700',
  emerald: 'bg-emerald-50 text-emerald-700',
  amber: 'bg-amber-50 text-amber-700',
  red: 'bg-red-50 text-red-700',
  sky: 'bg-sky-50 text-sky-700',
  violet: 'bg-violet-50 text-violet-700',
};

const StatCard = ({ label, value, sublabel, icon: Icon, tone = 'brand' }) => (
  <div className="card card-pad animate-fade-in">
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="truncate text-xs font-semibold uppercase tracking-wide text-ink-500">{label}</p>
        <p className="mt-2 text-2xl font-bold text-ink-900 sm:text-3xl">{value}</p>
        {sublabel && <p className="mt-1 truncate text-xs text-ink-500">{sublabel}</p>}
      </div>
      {Icon && (
        <span className={`shrink-0 rounded-xl p-2.5 ${TONES[tone] || TONES.brand}`}>
          <Icon className="h-5 w-5" />
        </span>
      )}
    </div>
  </div>
);

export default StatCard;
