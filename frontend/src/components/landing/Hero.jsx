import { Suspense, lazy, useRef } from 'react';
import { motion, useInView, useReducedMotion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import ActionLink from './ActionLink.jsx';
import { SceneBoundary, SceneFallback } from './SceneBoundary.jsx';
import { hasWebGL, useMediaQuery } from './hooks.js';

// three.js + React Three Fiber are only downloaded when the hero mounts.
const HeroScene = lazy(() => import('./HeroScene.jsx'));

const container = { hidden: {}, show: { transition: { staggerChildren: 0.11, delayChildren: 0.15 } } };
const item = { hidden: { opacity: 0, y: 22 }, show: { opacity: 1, y: 0, transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] } } };

const LEGEND = [
  { color: 'bg-blue-500', label: 'Mentor' },
  { color: 'bg-sky-300', label: 'Students' },
  { color: 'bg-amber-400', label: 'Needs attention' },
];

const Hero = () => {
  const sceneRef = useRef(null);
  const onScreen = useInView(sceneRef, { margin: '80px' });
  const reduced = useReducedMotion();
  const compact = useMediaQuery('(max-width: 767px)');
  const webgl = hasWebGL();

  return (
    <section id="home" className="relative overflow-hidden pb-14 pt-28 sm:pt-32 lg:pb-24 lg:pt-36">
      <div aria-hidden="true" className="lp-grid pointer-events-none absolute inset-0" />
      <div
        aria-hidden="true"
        className="lp-fade-bottom pointer-events-none absolute inset-0 bg-[radial-gradient(55%_50%_at_72%_35%,rgba(37,99,235,0.32),transparent),radial-gradient(35%_35%_at_8%_85%,rgba(34,211,238,0.12),transparent)]"
      />

      <div className="lp-container relative grid items-center gap-8 md:grid-cols-2 md:gap-6">
        <motion.div variants={container} initial="hidden" animate="show">
          <motion.span
            variants={item}
            className="inline-flex items-center gap-2 rounded-full border border-cyan-300/25 bg-cyan-300/10 px-3.5 py-1.5 text-sm font-medium text-cyan-100"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inset-0 animate-pulse-ring rounded-full bg-cyan-300" />
              <span className="relative h-2 w-2 rounded-full bg-cyan-300" />
            </span>
            Smart Student Mentoring Platform
          </motion.span>

          <motion.h1 variants={item} className="lp-heading mt-6 text-[2.5rem] leading-[1.08] sm:text-5xl lg:text-[3.75rem]">
            Empowering Students Through Smarter Mentoring
          </motion.h1>

          <motion.p variants={item} className="mt-6 max-w-xl text-base leading-relaxed text-slate-300 sm:text-lg">
            Connect mentors, monitor academic progress, manage counseling sessions, and support every student&apos;s journey
            through one intelligent platform.
          </motion.p>

          <motion.div variants={item} className="mt-9 flex flex-col gap-3 sm:flex-row">
            <ActionLink to="/register">
              Get Started <ArrowRight size={16} aria-hidden="true" />
            </ActionLink>
            <ActionLink href="#features" variant="ghost">Explore Features</ActionLink>
          </motion.div>
        </motion.div>

        <motion.div
          ref={sceneRef}
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="relative mx-auto aspect-square w-full max-w-[340px] sm:max-w-[440px] md:max-w-[520px] lg:max-w-[600px]"
          role="img"
          aria-label="Interactive 3D network: one mentor connected to many students, surrounded by books and graduation caps"
        >
          {webgl ? (
            <SceneBoundary>
              <Suspense fallback={<SceneFallback />}>
                <HeroScene reduced={Boolean(reduced)} compact={compact} active={onScreen} />
              </Suspense>
            </SceneBoundary>
          ) : (
            <SceneFallback />
          )}

          <ul className="absolute -bottom-5 left-1/2 flex -translate-x-1/2 items-center gap-4 rounded-full border border-white/10 bg-navy-900/70 px-4 py-2 text-xs text-slate-300 md:backdrop-blur">
            {LEGEND.map((l) => (
              <li key={l.label} className="flex items-center gap-1.5 whitespace-nowrap">
                <span className={`h-2 w-2 rounded-full ${l.color}`} aria-hidden="true" />
                {l.label}
              </li>
            ))}
          </ul>
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;
