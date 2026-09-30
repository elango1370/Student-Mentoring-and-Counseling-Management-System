import { useEffect, useState } from 'react';
import { IconClose, IconSearch } from './Icons.jsx';

const SearchBar = ({ value, onChange, placeholder = 'Search…', delay = 350, className = '' }) => {
  const [local, setLocal] = useState(value || '');

  useEffect(() => {
    setLocal(value || '');
  }, [value]);

  useEffect(() => {
    const id = setTimeout(() => {
      if (local !== value) onChange(local);
    }, delay);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [local]);

  return (
    <div className={`relative ${className}`}>
      <IconSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
      <input
        type="search"
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        placeholder={placeholder}
        className="input pl-9 pr-9"
        aria-label={placeholder}
      />
      {local && (
        <button
          type="button"
          onClick={() => setLocal('')}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-ink-400 transition hover:bg-ink-100 hover:text-ink-700"
          aria-label="Clear search"
        >
          <IconClose className="h-4 w-4" />
        </button>
      )}
    </div>
  );
};

export default SearchBar;
