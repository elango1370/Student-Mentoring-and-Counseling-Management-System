const Pagination = ({ page, pages, total, limit, onChange }) => {
  if (!pages || pages <= 1) return null;

  const start = (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);

  const numbers = [];
  const from = Math.max(1, page - 2);
  const to = Math.min(pages, from + 4);
  for (let i = from; i <= to; i += 1) numbers.push(i);

  return (
    <div className="flex flex-col items-center justify-between gap-3 border-t border-ink-200 px-4 py-3 sm:flex-row">
      <p className="text-xs text-ink-500">
        Showing {start}–{end} of {total}
      </p>
      <div className="flex items-center gap-1">
        <button type="button" className="btn-secondary btn-sm" disabled={page <= 1} onClick={() => onChange(page - 1)}>
          Previous
        </button>
        {numbers.map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={`h-8 w-8 rounded-lg text-xs font-semibold transition ${
              n === page ? 'bg-brand-600 text-white' : 'text-ink-600 hover:bg-ink-100'
            }`}
          >
            {n}
          </button>
        ))}
        <button type="button" className="btn-secondary btn-sm" disabled={page >= pages} onClick={() => onChange(page + 1)}>
          Next
        </button>
      </div>
    </div>
  );
};

export default Pagination;
