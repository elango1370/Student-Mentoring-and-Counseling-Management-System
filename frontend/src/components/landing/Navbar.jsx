import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { LayoutDashboard, Menu, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import ActionLink from './ActionLink.jsx';
import Logo from './Logo.jsx';
import { NAV_LINKS } from './constants.js';

/** Highlights the nav link of the section currently in view. */
const useActiveSection = () => {
  const [active, setActive] = useState('home');
  useEffect(() => {
    const sections = NAV_LINKS.map((l) => document.getElementById(l.id)).filter(Boolean);
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActive(visible.target.id);
      },
      { rootMargin: '-40% 0px -50% 0px', threshold: [0, 0.25, 0.5, 1] }
    );
    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, []);
  return active;
};

const Navbar = () => {
  const { isAuthenticated, initialising } = useAuth();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const active = useActiveSection();
  const signedIn = !initialising && isAuthenticated;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close the mobile menu on Escape or when the viewport grows to desktop size.
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    const onResize = () => window.innerWidth >= 1024 && setOpen(false);
    window.addEventListener('keydown', onKey);
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', onResize);
    };
  }, [open]);

  const close = () => setOpen(false);

  return (
    <motion.header
      initial={{ y: -24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${
        scrolled || open ? 'border-b border-white/10 bg-navy-950/85 backdrop-blur-xl' : 'border-b border-transparent'
      }`}
    >
      <nav className="lp-container flex h-16 items-center justify-between" aria-label="Primary">
        <a href="#home" onClick={close} className="rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300" aria-label="SMCMS home">
          <Logo />
        </a>

        <ul className="hidden items-center gap-1 lg:flex">
          {NAV_LINKS.map((link) => (
            <li key={link.id}>
              <a
                href={`#${link.id}`}
                aria-current={active === link.id ? 'true' : undefined}
                className={`rounded-lg px-3 py-2 text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 ${
                  active === link.id ? 'bg-white/10 text-white' : 'text-slate-300 hover:text-white'
                }`}
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="hidden items-center gap-3 lg:flex">
          {signedIn ? (
            <ActionLink to="/dashboard" className="!py-2">
              <LayoutDashboard size={16} aria-hidden="true" /> Go to dashboard
            </ActionLink>
          ) : (
            <>
              <Link to="/login" className="lp-link px-3 py-2 font-medium">Login</Link>
              <ActionLink to="/register" className="!py-2">Get Started</ActionLink>
            </>
          )}
        </div>

        <button
          type="button"
          className="grid h-10 w-10 place-items-center rounded-lg border border-white/10 bg-white/5 text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 lg:hidden"
          aria-expanded={open}
          aria-controls="lp-mobile-menu"
          aria-label={open ? 'Close menu' : 'Open menu'}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div
            id="lp-mobile-menu"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden lg:hidden"
          >
            <ul className="lp-container flex flex-col gap-1 pb-3">
              {NAV_LINKS.map((link) => (
                <li key={link.id}>
                  <a
                    href={`#${link.id}`}
                    onClick={close}
                    className={`block rounded-lg px-3 py-3 text-base ${active === link.id ? 'bg-white/10 text-white' : 'text-slate-300'}`}
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
            <div className="lp-container flex gap-3 pb-5">
              {signedIn ? (
                <ActionLink to="/dashboard" className="flex-1">Go to dashboard</ActionLink>
              ) : (
                <>
                  <ActionLink to="/login" variant="ghost" className="flex-1">Login</ActionLink>
                  <ActionLink to="/register" className="flex-1">Get Started</ActionLink>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
};

export default Navbar;
