const base = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
};

const Svg = ({ children, className = 'h-5 w-5', ...rest }) => (
  <svg viewBox="0 0 24 24" className={className} {...base} {...rest} aria-hidden="true">
    {children}
  </svg>
);

export const IconDashboard = (p) => (
  <Svg {...p}><rect x="3" y="3" width="7" height="9" rx="1.5" /><rect x="14" y="3" width="7" height="5" rx="1.5" /><rect x="14" y="12" width="7" height="9" rx="1.5" /><rect x="3" y="16" width="7" height="5" rx="1.5" /></Svg>
);
export const IconUsers = (p) => (
  <Svg {...p}><path d="M16 20v-1.5a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4V20" /><circle cx="9" cy="7" r="3.5" /><path d="M22 20v-1.5a4 4 0 0 0-3-3.87" /><path d="M16 3.6a3.5 3.5 0 0 1 0 6.8" /></Svg>
);
export const IconMentor = (p) => (
  <Svg {...p}><path d="M12 3 2 8l10 5 10-5-10-5Z" /><path d="M6 10.5V16c0 1.5 2.7 3 6 3s6-1.5 6-3v-5.5" /></Svg>
);
export const IconChart = (p) => (
  <Svg {...p}><path d="M3 3v18h18" /><path d="M7 15l3.5-4 3 3L20 7" /></Svg>
);
export const IconCalendar = (p) => (
  <Svg {...p}><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 10h18" /></Svg>
);
export const IconChat = (p) => (
  <Svg {...p}><path d="M21 12a8 8 0 0 1-11.6 7.1L3 21l1.9-6.4A8 8 0 1 1 21 12Z" /></Svg>
);
export const IconNote = (p) => (
  <Svg {...p}><path d="M5 3h9l5 5v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" /><path d="M14 3v5h5M8 13h8M8 17h5" /></Svg>
);
export const IconShield = (p) => (
  <Svg {...p}><path d="M12 3 4 6v6c0 5 3.4 8.3 8 9 4.6-.7 8-4 8-9V6l-8-3Z" /><path d="m9 12 2 2 4-4" /></Svg>
);
export const IconUser = (p) => (
  <Svg {...p}><circle cx="12" cy="8" r="4" /><path d="M4 20.5a8 8 0 0 1 16 0" /></Svg>
);
export const IconSearch = (p) => (
  <Svg {...p}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></Svg>
);
export const IconPlus = (p) => (<Svg {...p}><path d="M12 5v14M5 12h14" /></Svg>);
export const IconEdit = (p) => (
  <Svg {...p}><path d="M4 20h4L20 8a2.8 2.8 0 0 0-4-4L4 16v4Z" /><path d="m14 6 4 4" /></Svg>
);
export const IconTrash = (p) => (
  <Svg {...p}><path d="M4 7h16M10 11v6M14 11v6" /><path d="M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13" /><path d="M9 7V4h6v3" /></Svg>
);
export const IconClose = (p) => (<Svg {...p}><path d="M6 6l12 12M18 6 6 18" /></Svg>);
export const IconCheck = (p) => (<Svg {...p}><path d="m4 12 5 5L20 6" /></Svg>);
export const IconAlert = (p) => (
  <Svg {...p}><path d="M12 3 2 20h20L12 3Z" /><path d="M12 9v5M12 17.5v.5" /></Svg>
);
export const IconInfo = (p) => (<Svg {...p}><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 7.5v.5" /></Svg>);
export const IconLogout = (p) => (
  <Svg {...p}><path d="M9 21H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h4" /><path d="m16 16 5-4-5-4M21 12H9" /></Svg>
);
export const IconMenu = (p) => (<Svg {...p}><path d="M4 7h16M4 12h16M4 17h16" /></Svg>);
export const IconBack = (p) => (<Svg {...p}><path d="M19 12H5M11 6l-6 6 6 6" /></Svg>);
export const IconLink = (p) => (
  <Svg {...p}><path d="M10 13a5 5 0 0 0 7 0l2-2a5 5 0 0 0-7-7l-1 1" /><path d="M14 11a5 5 0 0 0-7 0l-2 2a5 5 0 0 0 7 7l1-1" /></Svg>
);
export const IconInbox = (p) => (
  <Svg {...p}><path d="M3 13h5l1.5 3h5L16 13h5" /><path d="M5 5h14l2 8v6a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-6l2-8Z" /></Svg>
);
export const IconSpark = (p) => (
  <Svg {...p}><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18" /></Svg>
);
export const IconMail = (p) => (
  <Svg {...p}><path d="M4 5h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z" /><path d="m4 6 8 7 8-7" /></Svg>
);
