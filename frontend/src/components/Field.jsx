export const Field = ({ label, error, hint, required = false, children, className = '' }) => (
  <div className={className}>
    {label && (
      <label className="label">
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </label>
    )}
    {children}
    {error ? (
      <p className="mt-1 text-xs font-medium text-red-600">{error}</p>
    ) : hint ? (
      <p className="mt-1 text-xs text-ink-500">{hint}</p>
    ) : null}
  </div>
);

export const TextInput = ({ error, className = '', ...props }) => (
  <input {...props} className={`input ${error ? 'input-error' : ''} ${className}`} />
);

export const TextArea = ({ error, className = '', rows = 3, ...props }) => (
  <textarea {...props} rows={rows} className={`input resize-y ${error ? 'input-error' : ''} ${className}`} />
);

export const Select = ({ error, className = '', children, ...props }) => (
  <select {...props} className={`input appearance-none bg-white ${error ? 'input-error' : ''} ${className}`}>
    {children}
  </select>
);

export const Checkbox = ({ label, className = '', ...props }) => (
  <label className={`flex cursor-pointer items-center gap-2.5 text-sm text-ink-700 ${className}`}>
    <input
      type="checkbox"
      {...props}
      className="h-4 w-4 rounded border-ink-300 text-brand-600 focus:ring-2 focus:ring-brand-500/30"
    />
    {label}
  </label>
);
