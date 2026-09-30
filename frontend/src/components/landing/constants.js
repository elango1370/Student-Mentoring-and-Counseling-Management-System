// Shared by the navbar, footer and calls to action.
export const NAV_LINKS = [
  { id: 'home', label: 'Home' },
  { id: 'features', label: 'Features' },
  { id: 'how-it-works', label: 'How It Works' },
  { id: 'about', label: 'About' },
  { id: 'contact', label: 'Contact' },
];

// Set VITE_CONTACT_EMAIL in frontend/.env to show your college's real address.
export const CONTACT_EMAIL = import.meta.env.VITE_CONTACT_EMAIL || 'support@yourcollege.edu';
