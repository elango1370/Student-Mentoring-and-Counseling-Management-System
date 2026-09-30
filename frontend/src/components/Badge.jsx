import { TONES } from '../utils/constants.js';
import { titleCase } from '../utils/format.js';

const Badge = ({ value, tone, label, className = '' }) => {
  const resolved = tone || TONES[value] || 'bg-ink-200 text-ink-700';
  return <span className={`badge ${resolved} ${className}`}>{label ?? titleCase(value)}</span>;
};

export default Badge;
