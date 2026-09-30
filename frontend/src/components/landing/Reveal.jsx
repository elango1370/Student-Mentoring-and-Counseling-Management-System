import { motion } from 'framer-motion';

/** Fade + slide-up when scrolled into view (once). MotionConfig in Landing.jsx disables it for reduced-motion users. */
const Reveal = ({ as = 'div', delay = 0, y = 24, className, children, ...rest }) => {
  const Component = motion[as];
  return (
    <Component
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
      {...rest}
    >
      {children}
    </Component>
  );
};

export default Reveal;
