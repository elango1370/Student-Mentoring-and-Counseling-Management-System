import { NavLink } from 'react-router-dom';
import {
  IconCalendar, IconChart, IconChat, IconClose, IconDashboard, IconMentor,
  IconNote, IconShield, IconUser, IconUsers,
} from './Icons.jsx';

const NAV = {
  admin: [
    { to: '/dashboard', label: 'Dashboard', icon: IconDashboard },
    { to: '/students', label: 'Students', icon: IconUsers },
    { to: '/mentors', label: 'Mentors', icon: IconMentor },
    { to: '/assignments', label: 'Assignments', icon: IconShield },
    { to: '/subjects', label: 'Subjects', icon: IconChart },
    { to: '/profile', label: 'My Account', icon: IconUser },
  ],
  mentor: [
    { to: '/dashboard', label: 'Dashboard', icon: IconDashboard },
    { to: '/my-students', label: 'My Students', icon: IconUsers },
    { to: '/choose-students', label: 'Choose Students', icon: IconMentor },
    { to: '/subjects', label: 'My Subjects & Marks', icon: IconChart },
    { to: '/profile', label: 'My Account', icon: IconUser },
  ],
  student: [
    { to: '/dashboard', label: 'Dashboard', icon: IconDashboard },
    { to: '/my-profile', label: 'My Profile', icon: IconUser },
    { to: '/my-academics', label: 'Academics', icon: IconChart },
    { to: '/my-attendance', label: 'Attendance', icon: IconCalendar },
    { to: '/my-counseling', label: 'Counseling', icon: IconChat },
    { to: '/my-remarks', label: 'Remarks', icon: IconNote },
    { to: '/my-interventions', label: 'Interventions', icon: IconShield },
  ],
};

const Sidebar = ({ role, open, onClose }) => {
  const items = NAV[role] || [];

  const content = (
    <nav className="flex h-full flex-col">
      <div className="flex items-center gap-2.5 border-b border-ink-200 px-5 py-4">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-white">
          SM
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-ink-900">SMCMS</p>
          <p className="truncate text-[11px] text-ink-500">Mentoring &amp; Counseling</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-1.5 text-ink-400 hover:bg-ink-100 lg:hidden"
          aria-label="Close navigation"
        >
          <IconClose className="h-5 w-5" />
        </button>
      </div>

      <ul className="flex-1 space-y-1 overflow-y-auto p-3">
        {items.map(({ to, label, icon: Icon }) => (
          <li key={to}>
            <NavLink
              to={to}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                  isActive ? 'bg-brand-50 text-brand-700' : 'text-ink-600 hover:bg-ink-100 hover:text-ink-900'
                }`
              }
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span className="truncate">{label}</span>
            </NavLink>
          </li>
        ))}
      </ul>

      <div className="border-t border-ink-200 px-5 py-3">
        <p className="text-[11px] uppercase tracking-wide text-ink-400">Signed in as {role}</p>
      </div>
    </nav>
  );

  return (
    <>
      <aside className="hidden w-64 shrink-0 border-r border-ink-200 bg-white lg:block">{content}</aside>

      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-ink-900/50 backdrop-blur-sm"
            onClick={onClose}
            aria-label="Close navigation overlay"
          />
          <div className="animate-slide-in absolute inset-y-0 left-0 w-72 bg-white shadow-pop">{content}</div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
