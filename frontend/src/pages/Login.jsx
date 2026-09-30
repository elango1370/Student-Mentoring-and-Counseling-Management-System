import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { Field, TextInput } from '../components/Field.jsx';
import { Spinner } from '../components/States.jsx';
import { IconChart, IconMentor, IconShield, IconUser, IconUsers } from '../components/Icons.jsx';
import { isEmail, mergeServerErrors, minLength, runValidators } from '../utils/validation.js';

const HIGHLIGHTS = [
  { icon: IconUsers, title: 'Assigned mentoring', text: 'Every student is paired with a faculty mentor who owns their progress.' },
  { icon: IconChart, title: 'Progress at a glance', text: 'Academic scores and attendance percentages calculated continuously.' },
  { icon: IconShield, title: 'Structured interventions', text: 'Escalate, track and close support actions with a full audit trail.' },
];

const ROLE_TABS = [
  { role: 'student', label: 'Student', icon: IconUser, subtitle: 'Sign in to view your academics, attendance and mentor.', placeholder: 'you@gmail.com' },
  { role: 'mentor', label: 'Faculty / Mentor', icon: IconMentor, subtitle: 'Sign in to manage your assigned students.', placeholder: 'you@campus.edu' },
  { role: 'admin', label: 'Admin', icon: IconShield, subtitle: 'Sign in to manage the institution.', placeholder: 'you@campus.edu' },
];

const Login = () => {
  const { login, isAuthenticated, initialising } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [activeRole, setActiveRole] = useState('student');
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  if (!initialising && isAuthenticated) {
    return <Navigate to={location.state?.from || '/dashboard'} replace />;
  }

  const activeTab = ROLE_TABS.find((t) => t.role === activeRole);

  const switchRole = (role) => {
    setActiveRole(role);
    setErrors({});
  };

  const validate = () => {
    const next = runValidators({
      email: isEmail(form.email),
      password: minLength(form.password, 6, 'Password'),
    });
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      // The backend independently verifies the account's actual role matches
      // `role` here and rejects the request otherwise — this tab selection is
      // a convenience, not the security boundary.
      const user = await login({ ...form, role: activeRole });
      toast.success(`Welcome back, ${user.name.split(' ')[0]}.`);
      navigate(location.state?.from || '/dashboard', { replace: true });
    } catch (err) {
      setErrors((prev) => mergeServerErrors(prev, err.details));
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between bg-brand-700 p-10 text-white lg:flex">
        <div
          className="pointer-events-none absolute inset-0 opacity-25"
          style={{ backgroundImage: 'radial-gradient(circle at 20% 20%, #818cf8 0, transparent 45%), radial-gradient(circle at 80% 70%, #0891b2 0, transparent 45%)' }}
        />
        <div className="relative">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 text-base font-bold backdrop-blur">SM</span>
            <div>
              <p className="text-base font-bold">SMCMS</p>
              <p className="text-xs text-white/70">Student Mentoring &amp; Counseling</p>
            </div>
          </div>
        </div>

        <div className="relative max-w-md">
          <h2 className="text-3xl font-bold leading-tight">
            One record for every student&apos;s academic and personal journey.
          </h2>
          <ul className="mt-8 space-y-5">
            {HIGHLIGHTS.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex gap-3.5">
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/15 backdrop-blur">
                  <Icon className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-semibold">{title}</p>
                  <p className="mt-0.5 text-sm text-white/75">{text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-white/60">
          Students can create their own accounts with their personal email. Faculty and administrator accounts are provisioned by the institution.
        </p>
      </div>

      <div className="flex items-center justify-center bg-ink-50 px-5 py-12 sm:px-8">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-sm font-bold text-white">SM</span>
            <div>
              <p className="text-sm font-bold text-ink-900">SMCMS</p>
              <p className="text-xs text-ink-500">Student Mentoring &amp; Counseling</p>
            </div>
          </div>

          <div className="card card-pad">
            <div className="mb-5 flex items-start gap-3">
              <span className="rounded-xl bg-brand-50 p-2.5 text-brand-600">
                <activeTab.icon className="h-5 w-5" />
              </span>
              <div>
                <h1 className="text-xl font-bold text-ink-900">Sign in</h1>
                <p className="mt-0.5 text-sm text-ink-500">{activeTab.subtitle}</p>
              </div>
            </div>

            <div className="mb-6 grid grid-cols-3 gap-1 rounded-xl border border-ink-200 bg-ink-50 p-1">
              {ROLE_TABS.map(({ role, label }) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => switchRole(role)}
                  className={`rounded-lg px-2 py-2 text-xs font-semibold transition sm:text-sm ${
                    activeRole === role ? 'bg-white text-brand-700 shadow-card' : 'text-ink-500 hover:text-ink-800'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <form onSubmit={submit} className="space-y-4" noValidate>
              <Field label="Email address" error={errors.email} required>
                <TextInput
                  type="email"
                  autoComplete="email"
                  value={form.email}
                  error={errors.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder={activeTab.placeholder}
                />
              </Field>

              <Field
                label={
                  <span className="flex items-center justify-between">
                    Password
                    <Link to="/forgot-password" className="text-xs font-semibold text-brand-700 hover:text-brand-800">Forgot password?</Link>
                  </span>
                }
                error={errors.password}
                required
              >
                <TextInput
                  type="password"
                  autoComplete="current-password"
                  value={form.password}
                  error={errors.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••"
                />
              </Field>

              <button type="submit" className="btn-primary w-full" disabled={submitting}>
                {submitting && <Spinner className="h-4 w-4" />}
                {submitting ? 'Signing in…' : `Sign in as ${activeTab.label}`}
              </button>
            </form>

            {activeRole === 'student' && (
              <p className="mt-6 border-t border-ink-100 pt-5 text-center text-sm text-ink-500">
                New student?{' '}
                <Link to="/register" className="font-semibold text-brand-700 hover:text-brand-800">Create an account</Link>
              </p>
            )}
            {activeRole === 'mentor' && (
              <p className="mt-6 border-t border-ink-100 pt-5 text-center text-xs text-ink-500">
                Faculty/mentor accounts are created by an administrator and cannot be self-registered.
              </p>
            )}
            {activeRole === 'admin' && (
              <p className="mt-6 border-t border-ink-100 pt-5 text-center text-xs text-ink-500">
                Admin accounts are created by an existing administrator and cannot be self-registered.
              </p>
            )}
          </div>

          <p className="mt-6 text-center text-xs text-ink-500">
            Trouble signing in? Contact your department administrator.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
