import { useId } from 'react';

/** SMCMS mark: one mentor node connected to three student nodes. */
const Logo = ({ className = '' }) => {
  const gradient = `lp-logo-${useId().replace(/:/g, '')}`;
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <svg viewBox="0 0 32 32" className="h-8 w-8" aria-hidden="true">
        <defs>
          <linearGradient id={gradient} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#3b82f6" />
            <stop offset="1" stopColor="#22d3ee" />
          </linearGradient>
        </defs>
        <rect width="32" height="32" rx="9" fill={`url(#${gradient})`} />
        <g stroke="#04102b" strokeWidth="1.4" strokeLinecap="round" opacity="0.7">
          <path d="M16 16 8.5 9M16 16l8-6M16 16l0 9" />
        </g>
        <circle cx="16" cy="16" r="3.4" fill="#04102b" />
        <circle cx="8.5" cy="9" r="2.1" fill="#04102b" />
        <circle cx="24" cy="10" r="2.1" fill="#04102b" />
        <circle cx="16" cy="25" r="2.1" fill="#04102b" />
      </svg>
      <span className="font-display text-lg font-semibold tracking-tight text-white">SMCMS</span>
    </span>
  );
};

export default Logo;
