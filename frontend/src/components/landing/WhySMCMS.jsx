import { BarChart3, ClipboardList, Database, MessageCircle, Search } from 'lucide-react';
import Reveal from './Reveal.jsx';
import SectionHeading from './SectionHeading.jsx';

const BENEFITS = [
  {
    icon: Database,
    title: 'Centralized Student Information',
    text: 'Profiles, marks, attendance and notes live in one record instead of scattered spreadsheets.',
  },
  {
    icon: MessageCircle,
    title: 'Better Mentor-Student Communication',
    text: 'Mentors walk into every conversation with the full picture, and students can see the remarks and follow-ups shared with them.',
  },
  {
    icon: Search,
    title: 'Early Identification of Academic Issues',
    text: 'Low scores and falling attendance surface early, while there is still time to help.',
  },
  {
    icon: ClipboardList,
    title: 'Structured Counseling Records',
    text: 'Each session captures what was discussed, what was agreed and when to follow up.',
  },
  {
    icon: BarChart3,
    title: 'Data-Driven Student Support',
    text: 'Decisions rest on attendance, marks and intervention history rather than memory.',
  },
];

const WhySMCMS = () => (
  <section className="relative scroll-mt-20 py-20 sm:py-28">
    <div className="lp-container grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20">
      <div className="lg:sticky lg:top-28 lg:self-start">
        <SectionHeading title="Why colleges choose SMCMS">
          Mentoring works when the right information reaches the right person at the right time.
        </SectionHeading>
      </div>

      <ul className="divide-y divide-white/10 border-y border-white/10">
        {BENEFITS.map((b, i) => {
          const Icon = b.icon;
          return (
            <Reveal as="li" key={b.title} delay={i * 0.05} y={18} className="flex gap-5 py-6">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-cyan-400/10 text-cyan-300 ring-1 ring-cyan-300/25">
                <Icon size={20} aria-hidden="true" />
              </span>
              <div>
                <h3 className="font-display text-base font-semibold text-white sm:text-lg">{b.title}</h3>
                <p className="mt-1.5 max-w-lg text-sm leading-relaxed text-slate-400">{b.text}</p>
              </div>
            </Reveal>
          );
        })}
      </ul>
    </div>
  </section>
);

export default WhySMCMS;
