import { Mail } from 'lucide-react';
import ActionLink from './ActionLink.jsx';
import Reveal from './Reveal.jsx';
import { CONTACT_EMAIL } from './constants.js';

const CTA = () => (
  <section className="relative py-20 sm:py-28">
    <div className="lp-container">
      <Reveal className="lp-glass relative overflow-hidden px-6 py-14 text-center sm:px-12 sm:py-20" y={32}>
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_80%_at_50%_0%,rgba(59,130,246,0.32),transparent),radial-gradient(40%_60%_at_85%_100%,rgba(34,211,238,0.16),transparent)]"
        />
        <div className="relative mx-auto max-w-2xl">
          <h2 className="lp-heading text-3xl sm:text-4xl lg:text-5xl">Build a Better Support System for Every Student</h2>
          <p className="mt-5 text-base text-slate-300 sm:text-lg">Give mentors the tools they need to guide students effectively.</p>
          <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
            <ActionLink to="/register">Get Started</ActionLink>
            <ActionLink href={`mailto:${CONTACT_EMAIL}`} variant="ghost">
              <Mail size={16} aria-hidden="true" /> Contact Us
            </ActionLink>
          </div>
        </div>
      </Reveal>
    </div>
  </section>
);

export default CTA;
