import { Suspense, lazy, useCallback, useEffect, useRef, useState } from 'react';
import { useInView, useReducedMotion } from 'framer-motion';
import { CalendarCheck, GraduationCap, MessagesSquare, RotateCcw, ShieldCheck, TrendingUp, Users } from 'lucide-react';
import SectionHeading from './SectionHeading.jsx';
import { SceneBoundary, SceneFallback } from './SceneBoundary.jsx';
import { hasWebGL, useMediaQuery } from './hooks.js';
import { FLOW_STEPS } from './flowSteps.js';

const DataFlowScene = lazy(() => import('./DataFlowScene.jsx'));

const ICONS = {
  mentor: GraduationCap,
  students: Users,
  academic: TrendingUp,
  attendance: CalendarCheck,
  counseling: MessagesSquare,
  intervention: ShieldCheck,
};

const LAST = FLOW_STEPS.length - 1;

const DataFlow = () => {
  const sceneBox = useRef(null);
  const nearby = useInView(sceneBox, { once: true, margin: '400px 0px' }); // start loading three.js early
  const entered = useInView(sceneBox, { once: true, amount: 0.35 }); //       start drawing the connections
  const visible = useInView(sceneBox, { margin: '100px' }); //                pause rendering when off screen
  const reduced = Boolean(useReducedMotion());
  const compact = useMediaQuery('(max-width: 767px)');
  const webgl = hasWebGL();

  const [step, setStep] = useState(-1);
  const [runId, setRunId] = useState(0);
  const onStep = useCallback((i) => setStep(i), []);

  // If the scene can't report progress (e.g. it failed to start), still show the whole list.
  useEffect(() => {
    if (!entered || step >= 0) return undefined;
    const timer = setTimeout(() => setStep((s) => (s < 0 ? LAST : s)), 3500);
    return () => clearTimeout(timer);
  }, [entered, step]);

  const shown = webgl ? step : LAST;

  return (
    <section className="relative scroll-mt-20 py-20 sm:py-28">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(45%_50%_at_75%_50%,rgba(99,102,241,0.16),transparent)]" />
      <div className="lp-container relative grid items-center gap-12 lg:grid-cols-[1fr_1.05fr] lg:gap-16">
        <div>
          <SectionHeading title="One connected flow, from mentor to intervention">
            Every stage feeds the next, so a low score or a missed class turns into a follow-up instead of being noticed too late.
          </SectionHeading>

          <ol className="mt-10">
            {FLOW_STEPS.map((s, i) => {
              const Icon = ICONS[s.id];
              const on = i <= shown;
              return (
                <li key={s.id} className="relative flex gap-4 pb-6 last:pb-0">
                  {i < LAST && (
                    <span aria-hidden="true" className="absolute bottom-0 left-[19px] top-10 w-px bg-white/10">
                      <span
                        className="absolute inset-x-0 top-0 origin-top bg-gradient-to-b from-cyan-300/80 to-transparent transition-transform duration-700"
                        style={{ height: '100%', transform: `scaleY(${i < shown ? 1 : 0})` }}
                      />
                    </span>
                  )}
                  <span
                    className="relative z-10 grid h-10 w-10 shrink-0 place-items-center rounded-full border transition-all duration-500"
                    style={{
                      borderColor: on ? `${s.color}88` : 'rgba(255,255,255,0.12)',
                      backgroundColor: on ? `${s.color}22` : 'rgba(255,255,255,0.03)',
                      color: on ? s.color : '#64748b',
                    }}
                  >
                    <Icon size={18} aria-hidden="true" />
                  </span>
                  <div className={`pt-1 transition-opacity duration-500 ${on ? 'opacity-100' : 'opacity-40'}`}>
                    <h3 className="font-display text-base font-semibold text-white">{s.label}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-slate-400">{s.text}</p>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>

        <div className="mx-auto w-full max-w-[460px]">
          <div
            ref={sceneBox}
            className="lp-glass relative aspect-[4/5] w-full overflow-hidden"
            role="img"
            aria-label="3D diagram connecting mentor, students, academic progress, attendance, counseling and intervention"
          >
            <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_45%,rgba(59,130,246,0.18),transparent)]" />
            {webgl && nearby ? (
              <SceneBoundary>
                <Suspense fallback={<SceneFallback />}>
                  <DataFlowScene active={entered} visible={visible} reduced={reduced} compact={compact} runId={runId} onStep={onStep} />
                </Suspense>
              </SceneBoundary>
            ) : (
              <SceneFallback />
            )}
          </div>

          {webgl && !reduced && (
            <button
              type="button"
              onClick={() => {
                setStep(-1);
                setRunId((n) => n + 1);
              }}
              className="lp-link mx-auto mt-4 flex items-center gap-2 px-3 py-2"
            >
              <RotateCcw size={14} aria-hidden="true" /> Replay animation
            </button>
          )}
        </div>
      </div>
    </section>
  );
};

export default DataFlow;
