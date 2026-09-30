import { BookOpen, GraduationCap, ShieldCheck } from 'lucide-react';
import Reveal from './Reveal.jsx';
import SectionHeading from './SectionHeading.jsx';

const ROLES = [
  {
    icon: ShieldCheck,
    title: 'Administrators',
    text: 'Manage mentors, students and assignments across the institution.',
    tile: 'bg-violet-500/15 text-violet-300 ring-violet-400/30',
  },
  {
    icon: GraduationCap,
    title: 'Mentors',
    text: 'Follow assigned students and record sessions, remarks and interventions.',
    tile: 'bg-blue-500/15 text-blue-300 ring-blue-400/30',
  },
  {
    icon: BookOpen,
    title: 'Students',
    text: 'See their own academics, attendance and the guidance shared by their mentor.',
    tile: 'bg-teal-400/15 text-teal-300 ring-teal-300/30',
  },
];

const About = () => (
  <section id="about" className="relative scroll-mt-20 py-20 sm:py-28">
    <div className="lp-container grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
      <div>
        <SectionHeading title="Built for the way colleges support students" />
        <Reveal delay={0.1} className="mt-5 space-y-4 text-base leading-relaxed text-slate-300">
          <p>
            SMCMS provides colleges with a centralized platform to help mentors understand student progress and provide timely
            academic and counseling support.
          </p>
          <p className="text-slate-400">
            Marks, attendance, counseling sessions, mentor remarks and interventions are connected in one place, so support starts
            with what is actually happening to each student.
          </p>
        </Reveal>
      </div>

      <ul className="space-y-4">
        {ROLES.map((role, i) => {
          const Icon = role.icon;
          return (
            <Reveal as="li" key={role.title} delay={i * 0.08} y={20} className="lp-glass flex items-start gap-4 p-5">
              <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ring-1 ${role.tile}`}>
                <Icon size={20} aria-hidden="true" />
              </span>
              <div>
                <h3 className="font-display text-base font-semibold text-white">{role.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-slate-400">{role.text}</p>
              </div>
            </Reveal>
          );
        })}
      </ul>
    </div>
  </section>
);

export default About;
