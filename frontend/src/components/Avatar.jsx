import { initials } from '../utils/format.js';

const SIZES = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-14 w-14 text-base',
  xl: 'h-20 w-20 text-xl',
};

const Avatar = ({ name = '', color = '#4f46e5', size = 'md', className = '' }) => (
  <span
    className={`inline-flex shrink-0 items-center justify-center rounded-full font-bold text-white ring-2 ring-white ${SIZES[size]} ${className}`}
    style={{ backgroundColor: color }}
    aria-hidden="true"
  >
    {initials(name)}
  </span>
);

export default Avatar;
