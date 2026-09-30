import { useRef } from 'react';
import { motion, useScroll, useSpring } from 'framer-motion';
import SectionHeading from './SectionHeading.jsx';

const STEPS = [
  {
    number: '01',
    title: 'Add Students',
    text: 'Register students with their department, year and semester so every record starts from one source.',
  },
  {
    number: '02',
    title: 'Assign Mentors',
    text: 'Pair each student with a faculty mentor. Administrators can rebalance assignments whenever needed.',
  },
  {
    number: '03',
    title: 'Monitor Progress',
    text: 'Follow marks, attendance and mentor remarks as they build up through the semester.',
  },
  {
    number: '04',
    title: 'Take Action',
    text: 'Schedule counseling, log interventions and follow up until each concern is closed.',
  },
];

const HowItWorks = () => {
  const listRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: listRef, offset: ['start 80%', 'end 60%'] });
  const fill = useSpring(scrollYProgress, { stiffness: 110, damping: 28, mass: 0.4 });

  return (
    <section id="how-it-works" className="relative scroll-mt-20 py-20 sm:py-28">
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-1/3 h-72 bg-[radial-gradient(50%_50%_at_50%_50%,rgba(37,99,235,0.14),transparent)]" />
      <div className="lp-container relative">
        <SectionHeading title="From student roster to action in four steps">
          A simple workflow that follows how mentoring already works in a college.
        </SectionHeading>

        <ol ref={listRef} className="relative mt-14 grid gap-10 lg:grid-cols-4 lg:gap-6">
          {/* Connecting line: vertical on small screens, horizontal on desktop. It fills as you scroll. */}
          <span aria-hidden="true" className="absolute bottom-6 left-7 top-7 w-px bg-white/10 lg:hidden" />
          <motion.span
            aria-hidden="true"
            style={{ scaleY: fill, originY: 0 }}
            className="absolute bottom-6 left-7 top-7 w-px bg-gradient-to-b from-blue-400 to-cyan-300 lg:hidden"
          />
          <span aria-hidden="true" className="absolute left-[12.5%] right-[12.5%] top-7 hidden h-px bg-white/10 lg:block" />
          <motion.span
            aria-hidden="true"
            style={{ scaleX: fill, originX: 0 }}
            className="absolute left-[12.5%] right-[12.5%] top-7 hidden h-px bg-gradient-to-r from-blue-400 to-cyan-300 lg:block"
          />

          {STEPS.map((step, i) => (
            <motion.li
              key={step.number}
              initial={{ opacity: 0, y: 26 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.6, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="relative flex gap-5 lg:flex-col lg:items-center lg:gap-0 lg:text-center"
            >
              <span className="relative z-10 grid h-14 w-14 shrink-0 place-items-center rounded-full border border-cyan-300/40 bg-navy-900 font-display text-base font-semibold text-cyan-200 shadow-[0_0_28px_-6px_rgba(34,211,238,0.6)]">
                {step.number}
              </span>
              <div className="lg:mt-6">
                <h3 className="font-display text-lg font-semibold text-white">{step.title}</h3>
                <p className="mt-2 max-w-xs text-sm leading-relaxed text-slate-400">{step.text}</p>
              </div>
            </motion.li>
          ))}
        </ol>
      </div>
    </section>
  );
};

export default HowItWorks;
