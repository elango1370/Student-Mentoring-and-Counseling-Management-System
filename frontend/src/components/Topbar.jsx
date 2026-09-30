import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Avatar from './Avatar.jsx';
import { IconLogout, IconMenu, IconUser } from './Icons.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';

const Topbar = ({ onMenu }) => {
  const { user, logout, role } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();
  const toast = useToast();

  useEffect(() => {
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const handleLogout = async () => {
    await logout();
    toast.success('You have been logged out.');
    navigate('/login', { replace: true });
  };

  const profilePath = role === 'student' ? '/my-profile' : '/profile';

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-ink-200 bg-white/90 px-4 backdrop-blur sm:px-6">
      <button
        type="button"
        onClick={onMenu}
        className="rounded-lg p-2 text-ink-600 transition hover:bg-ink-100 lg:hidden"
        aria-label="Open navigation"
      >
        <IconMenu />
      </button>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-ink-900">
          Welcome back, {user?.name?.split(' ')[0] || 'there'}
        </p>
        <p className="truncate text-xs text-ink-500">
          {role === 'admin' ? 'Administrator' : role === 'mentor' ? 'Faculty Mentor' : 'Student'}
          {user?.department ? ` · ${user.department}` : ''}
        </p>
      </div>

      <div className="relative" ref={ref}>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-2 rounded-full p-1 transition hover:bg-ink-100"
          aria-haspopup="menu"
          aria-expanded={open}
        >
          <Avatar name={user?.name} color={user?.avatarColor} size="sm" />
        </button>

        {open && (
          <div className="animate-scale-in absolute right-0 mt-2 w-60 overflow-hidden rounded-xl border border-ink-200 bg-white shadow-pop">
            <div className="border-b border-ink-100 px-4 py-3">
              <p className="truncate text-sm font-semibold text-ink-900">{user?.name}</p>
              <p className="truncate text-xs text-ink-500">{user?.email}</p>
            </div>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                navigate(profilePath);
              }}
              className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-ink-700 transition hover:bg-ink-100"
            >
              <IconUser className="h-4 w-4" /> My account
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center gap-2.5 border-t border-ink-100 px-4 py-2.5 text-sm text-red-600 transition hover:bg-red-50"
            >
              <IconLogout className="h-4 w-4" /> Log out
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Topbar;
