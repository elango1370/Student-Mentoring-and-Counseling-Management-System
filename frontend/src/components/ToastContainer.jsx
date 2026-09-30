import { IconAlert, IconCheck, IconClose, IconInfo } from './Icons.jsx';

const STYLES = {
  success: { wrap: 'border-emerald-200 bg-emerald-50', icon: 'text-emerald-600', Icon: IconCheck },
  error: { wrap: 'border-red-200 bg-red-50', icon: 'text-red-600', Icon: IconAlert },
  warning: { wrap: 'border-amber-200 bg-amber-50', icon: 'text-amber-600', Icon: IconAlert },
  info: { wrap: 'border-sky-200 bg-sky-50', icon: 'text-sky-600', Icon: IconInfo },
};

const ToastContainer = ({ toasts, onDismiss }) => {
  if (!toasts.length) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[100] flex flex-col items-center gap-2 p-4 sm:items-end">
      {toasts.map((toast) => {
        const style = STYLES[toast.type] || STYLES.info;
        const { Icon } = style;
        return (
          <div
            key={toast.id}
            role="status"
            className={`pointer-events-auto flex w-full max-w-sm animate-slide-in items-start gap-3 rounded-xl border px-4 py-3 shadow-pop ${style.wrap}`}
          >
            <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${style.icon}`} />
            <p className="flex-1 text-sm font-medium text-ink-800">{toast.message}</p>
            <button
              type="button"
              onClick={() => onDismiss(toast.id)}
              className="shrink-0 rounded-md p-1 text-ink-400 transition hover:bg-white/70 hover:text-ink-700"
              aria-label="Dismiss notification"
            >
              <IconClose className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default ToastContainer;
