import { IconAlert, IconInbox } from './Icons.jsx';

export const Spinner = ({ className = 'h-5 w-5' }) => (
  <svg className={`animate-spin ${className}`} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-20" />
    <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
  </svg>
);

export const LoadingState = ({ label = 'Loading…', className = '' }) => (
  <div className={`flex flex-col items-center justify-center gap-3 py-16 text-ink-500 ${className}`}>
    <Spinner className="h-8 w-8 text-brand-600" />
    <p className="text-sm font-medium">{label}</p>
  </div>
);

export const ErrorState = ({ message = 'Something went wrong.', onRetry, className = '' }) => (
  <div className={`flex flex-col items-center justify-center gap-3 rounded-xl border border-red-200 bg-red-50 px-6 py-12 text-center ${className}`}>
    <IconAlert className="h-9 w-9 text-red-500" />
    <p className="max-w-md text-sm font-medium text-red-700">{message}</p>
    {onRetry && (
      <button type="button" onClick={onRetry} className="btn-secondary btn-sm">
        Try again
      </button>
    )}
  </div>
);

export const EmptyState = ({ title = 'Nothing here yet', message = '', action = null, className = '' }) => (
  <div className={`flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-ink-300 bg-white px-6 py-14 text-center ${className}`}>
    <span className="rounded-full bg-ink-100 p-3 text-ink-400">
      <IconInbox className="h-7 w-7" />
    </span>
    <div>
      <p className="text-sm font-semibold text-ink-800">{title}</p>
      {message && <p className="mt-1 max-w-md text-sm text-ink-500">{message}</p>}
    </div>
    {action}
  </div>
);

export const Skeleton = ({ className = 'h-4 w-full' }) => (
  <div className={`animate-pulse rounded-md bg-ink-200 ${className}`} />
);
