import { Link } from 'react-router-dom';
import Logo from './Logo.jsx';
import { CONTACT_EMAIL, NAV_LINKS } from './constants.js';

const FEATURE_LINKS = ['Academic Progress', 'Attendance Tracking', 'Counseling Management', 'Mentor Remarks', 'Intervention History', 'Student Monitoring'];

const Footer = () => (
  <footer id="contact" className="scroll-mt-20 border-t border-white/10 bg-navy-900/60">
    <div className="lp-container grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
      <div>
        <Logo />
        <p className="mt-4 max-w-xs text-sm leading-relaxed text-slate-400">
          Student Mentoring &amp; Counseling Management System. One platform for mentoring, academic progress, attendance and counseling.
        </p>
      </div>

      <nav aria-label="Quick links">
        <h2 className="font-display text-sm font-semibold text-white">Quick Links</h2>
        <ul className="mt-4 space-y-2.5">
          {NAV_LINKS.filter((l) => l.id !== 'contact').map((l) => (
            <li key={l.id}><a href={`#${l.id}`} className="lp-link">{l.label}</a></li>
          ))}
        </ul>
      </nav>

      <nav aria-label="Features">
        <h2 className="font-display text-sm font-semibold text-white">Features</h2>
        <ul className="mt-4 space-y-2.5">
          {FEATURE_LINKS.map((f) => (
            <li key={f}><a href="#features" className="lp-link">{f}</a></li>
          ))}
        </ul>
      </nav>

      <div>
        <h2 className="font-display text-sm font-semibold text-white">Contact</h2>
        <ul className="mt-4 space-y-2.5">
          <li><a href={`mailto:${CONTACT_EMAIL}`} className="lp-link break-all">{CONTACT_EMAIL}</a></li>
          <li><Link to="/login" className="lp-link">Login</Link></li>
          <li><Link to="/register" className="lp-link">Student registration</Link></li>
        </ul>
      </div>
    </div>

    <div className="border-t border-white/10">
      <p className="lp-container py-6 text-xs text-slate-500">&copy; {new Date().getFullYear()} SMCMS. All rights reserved.</p>
    </div>
  </footer>
);

export default Footer;
