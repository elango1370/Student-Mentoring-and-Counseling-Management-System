import Reveal from './Reveal.jsx';

const SectionHeading = ({ title, children, className = '' }) => (
  <Reveal className={`max-w-2xl ${className}`}>
    <h2 className="lp-heading text-3xl sm:text-4xl">{title}</h2>
    {children && <p className="mt-4 text-base leading-relaxed text-slate-400">{children}</p>}
  </Reveal>
);

export default SectionHeading;
