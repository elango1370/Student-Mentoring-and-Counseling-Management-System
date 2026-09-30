import { useRef } from 'react';
import { motion } from 'framer-motion';
import { CalendarCheck, History, MessagesSquare, NotebookPen, TrendingUp, Users } from 'lucide-react';
import SectionHeading from './SectionHeading.jsx';

const EASE = [0.22, 1, 0.36, 1];

/* Small decorative visuals (illustrative sample data, hidden from screen readers). */

const BarsVisual = () => (
  <div aria-hidden="true" className="flex h-24 max-w-md items-end gap-2.5">
    {[38, 52, 46, 66, 72, 84].map((h, i) => (
      <motion.span
        key={i}
        initial={{ scaleY: 0 }}
        whileInView={{ scaleY: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7, delay: 0.2 + i * 0.07, ease: EASE }}
        style={{ height: `${h}%`, originY: 1 }}
        className="flex-1 rounded-t-md bg-gradient-to-t from-blue-600/40 to-cyan-300/90"
      />
    ))}
  </div>
);

const RingVisual = () => (
  <div aria-hidden="true" className="relative h-20 w-20">
    <svg viewBox="0 0 72 72" className="h-full w-full -rotate-90">
      <circle cx="36" cy="36" r="29" fill="none" stroke="rgba(255,255,255,0.09)" strokeWidth="7" />
      <motion.circle
        cx="36"
        cy="36"
        r="29"
        fill="none"
        stroke="#2dd4bf"
        strokeWidth="7"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        whileInView={{ pathLength: 0.87 }}
        viewport={{ once: true }}
        transition={{ duration: 1.1, delay: 0.25, ease: EASE }}
      />
    </svg>
    <span className="absolute inset-0 grid place-items-center text-sm font-semibold text-white">87%</span>
  </div>
);

const JOURNEY = ['Profile', 'Academics', 'Attendance', 'Sessions', 'Remarks', 'Actions'];

const JourneyVisual = () => (
  <ol aria-hidden="true" className="relative flex w-full items-start justify-between gap-1">
    <span className="absolute left-3 right-3 top-[9px] h-px bg-gradient-to-r from-blue-400/60 via-cyan-300/60 to-amber-300/60" />
    {JOURNEY.map((label, i) => (
      <motion.li
        key={label}
        initial={{ opacity: 0, y: 8 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4, delay: 0.25 + i * 0.09 }}
        className="relative flex flex-1 flex-col items-center gap-2 text-center"
      >
        <span className={`h-[19px] w-[19px] rounded-full border-2 border-navy-900 ${i === JOURNEY.length - 1 ? 'bg-amber-300' : 'bg-cyan-300'}`} />
        <span className="text-[11px] text-slate-400 sm:text-xs">{label}</span>
      </motion.li>
    ))}
  </ol>
);

const FEATURES = [
  {
    id: 'academic',
    icon: TrendingUp,
    title: 'Academic Progress',
    text: 'Monitor student academic performance and identify areas that need attention.',
    tile: 'bg-blue-500/15 text-blue-300 ring-blue-400/30',
    span: 'sm:col-span-2 lg:col-span-4',
    visual: <BarsVisual />,
  },
  {
    id: 'attendance',
    icon: CalendarCheck,
    title: 'Attendance Tracking',
    text: 'Track attendance and identify students who may require intervention.',
    tile: 'bg-teal-400/15 text-teal-300 ring-teal-300/30',
    span: 'lg:col-span-2',
    visual: <RingVisual />,
  },
  {
    id: 'counseling',
    icon: MessagesSquare,
    title: 'Counseling Management',
    text: 'Record and manage counseling sessions and follow-up activities.',
    tile: 'bg-violet-500/15 text-violet-300 ring-violet-400/30',
    span: 'lg:col-span-2',
  },
  {
    id: 'remarks',
    icon: NotebookPen,
    title: 'Mentor Remarks',
    text: 'Maintain structured mentor observations and remarks.',
    tile: 'bg-sky-400/15 text-sky-300 ring-sky-300/30',
    span: 'lg:col-span-2',
  },
  {
    id: 'interventions',
    icon: History,
    title: 'Intervention History',
    text: 'Track previous interventions and student support activities.',
    tile: 'bg-amber-400/15 text-amber-300 ring-amber-300/30',
    span: 'lg:col-span-2',
  },
  {
    id: 'monitoring',
    icon: Users,
    title: 'Student Monitoring',
    text: "Maintain a centralized view of each student's mentoring journey.",
    tile: 'bg-cyan-400/15 text-cyan-300 ring-cyan-300/30',
    span: 'sm:col-span-2 lg:col-span-6',
    wide: true,
    visual: <JourneyVisual />,
  },
];

const FeatureCard = ({ feature, index }) => {
  const ref = useRef(null);
  const Icon = feature.icon;

  // Cursor-following highlight, driven by CSS variables so it never re-renders React.
  const onMove = (e) => {
    const rect = ref.current.getBoundingClientRect();
    ref.current.style.setProperty('--mx', `${e.clientX - rect.left}px`);
    ref.current.style.setProperty('--my', `${e.clientY - rect.top}px`);
  };

  return (
    <motion.article
      ref={ref}
      onMouseMove={onMove}
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.55, delay: (index % 3) * 0.08, ease: EASE }}
      whileHover={{ y: -6, transition: { duration: 0.2 } }}
      className={`lp-glass group relative overflow-hidden p-6 transition-colors hover:border-white/25 sm:p-7 ${feature.span}`}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(260px_circle_at_var(--mx,50%)_var(--my,50%),rgba(96,165,250,0.16),transparent_70%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
      />

      <div className={`relative flex h-full gap-6 ${feature.wide ? 'flex-col lg:flex-row lg:items-center lg:gap-14' : 'flex-col justify-between'}`}>
        <div className={feature.wide ? 'lg:max-w-sm lg:shrink-0' : ''}>
          <span className={`grid h-11 w-11 place-items-center rounded-xl ring-1 ${feature.tile}`}>
            <Icon size={22} aria-hidden="true" />
          </span>
          <h3 className="mt-5 font-display text-lg font-semibold text-white">{feature.title}</h3>
          <p className="mt-2 text-sm leading-relaxed text-slate-400">{feature.text}</p>
        </div>
        {feature.visual && <div className={feature.wide ? 'w-full' : 'mt-2'}>{feature.visual}</div>}
      </div>
    </motion.article>
  );
};

const Features = () => (
  <section id="features" className="relative scroll-mt-20 py-20 sm:py-28">
    <div className="lp-container">
      <SectionHeading title="Everything a mentor needs, in one place">
        Six connected modules replace scattered spreadsheets and paper registers, so every conversation starts with the full picture.
      </SectionHeading>

      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-6">
        {FEATURES.map((feature, index) => (
          <FeatureCard key={feature.id} feature={feature} index={index} />
        ))}
      </div>
    </div>
  </section>
);

export default Features;
