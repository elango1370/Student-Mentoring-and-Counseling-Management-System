import { useEffect } from 'react';
import { MotionConfig } from 'framer-motion';
import Navbar from '../components/landing/Navbar.jsx';
import Hero from '../components/landing/Hero.jsx';
import Features from '../components/landing/Features.jsx';
import HowItWorks from '../components/landing/HowItWorks.jsx';
import DataFlow from '../components/landing/DataFlow.jsx';
import DashboardPreview from '../components/landing/DashboardPreview.jsx';
import WhySMCMS from '../components/landing/WhySMCMS.jsx';
import About from '../components/landing/About.jsx';
import CTA from '../components/landing/CTA.jsx';
import Footer from '../components/landing/Footer.jsx';

const TITLE = 'SMCMS · Student Mentoring & Counseling Management System';

/** Public marketing page shown at "/". The dashboard app lives behind /login. */
const Landing = () => {
  // Dark page background + smooth anchor scrolling apply only while this page is mounted.
  useEffect(() => {
    const previousTitle = document.title;
    document.title = TITLE;
    document.documentElement.classList.add('lp-active');
    return () => {
      document.title = previousTitle;
      document.documentElement.classList.remove('lp-active');
    };
  }, []);

  return (
    // reducedMotion="user" makes every Framer Motion animation respect prefers-reduced-motion.
    <MotionConfig reducedMotion="user">
      <div className="relative isolate min-h-screen overflow-x-clip bg-navy-950 font-sans text-slate-200">
        <a href="#main" className="lp-btn-primary sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60]">
          Skip to content
        </a>
        <Navbar />
        <main id="main">
          <Hero />
          <Features />
          <HowItWorks />
          <DataFlow />
          <DashboardPreview />
          <WhySMCMS />
          <About />
          <CTA />
        </main>
        <Footer />
      </div>
    </MotionConfig>
  );
};

export default Landing;
