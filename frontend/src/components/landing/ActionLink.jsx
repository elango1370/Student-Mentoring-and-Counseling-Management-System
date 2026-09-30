import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const MotionLink = motion.create(Link);

const hover = { whileHover: { y: -2 }, whileTap: { scale: 0.97 }, transition: { type: 'spring', stiffness: 400, damping: 22 } };

/** Button-styled link with Framer Motion hover/tap. Pass `to` for in-app routes, `href` for anchors/mailto. */
const ActionLink = ({ to, href, variant = 'primary', className = '', children, ...rest }) => {
  const classes = `${variant === 'primary' ? 'lp-btn-primary' : 'lp-btn-ghost'} ${className}`;
  if (to) {
    return (
      <MotionLink to={to} className={classes} {...hover} {...rest}>
        {children}
      </MotionLink>
    );
  }
  return (
    <motion.a href={href} className={classes} {...hover} {...rest}>
      {children}
    </motion.a>
  );
};

export default ActionLink;
