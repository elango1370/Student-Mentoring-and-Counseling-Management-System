import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Field, TextInput } from '../components/Field.jsx';
import { Spinner } from '../components/States.jsx';
import { IconBack, IconMentor, IconShield } from '../components/Icons.jsx';
import { isEmail, runValidators } from '../utils/validation.js';

const ForgotPassword = () => {
  const { forgotPassword, isAuthenticated, initialising } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  if (!initialising && isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const submit = async (e) => {
    e.preventDefault();
    const next = runValidators({ email: isEmail(email) });
    setError(next.email || '');
    if (next.email) return;

    setSubmitting(true);
    try {
      const res = await forgotPassword(email);
      setSent(true);
      // The message is intentionally generic (never confirms whether the
      // email is registered), so it's safe to display as-is.
      setError('');
      setSuccessMessage(res.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-50 px-5 py-12 sm:px-8">
      <div className="w-full max-w-md">
        <div className="mb-8 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-sm font-bold text-white">SM</span>
          <div>
            <p className="text-sm font-bold text-ink-900">SMCMS</p>
            <p className="text-xs text-ink-500">Student Mentoring &amp; Counseling</p>
          </div>
        </div>

        <div className="card card-pad">
          {sent ? (
            <div className="text-center">
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                <IconMentor className="h-6 w-6" />
              </span>
              <h1 className="mt-4 text-xl font-bold text-ink-900">Check your email</h1>
              <p className="mt-2 text-sm text-ink-500">{successMessage}</p>
              <p className="mt-2 text-xs text-ink-400">The link expires in 15 minutes and can only be used once.</p>
              <Link to="/login" className="btn-secondary mt-6 inline-flex w-full items-center justify-center">
                Back to sign in
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-6 flex items-start gap-3">
                <span className="rounded-xl bg-brand-50 p-2.5 text-brand-600">
                  <IconShield className="h-5 w-5" />
                </span>
                <div>
                  <h1 className="text-xl font-bold text-ink-900">Forgot password</h1>
                  <p className="mt-0.5 text-sm text-ink-500">Enter the email on your account and we'll send a reset link.</p>
                </div>
              </div>

              <form onSubmit={submit} className="space-y-4" noValidate>
                <Field label="Email address" error={error} required>
                  <TextInput
                    type="email"
                    autoComplete="email"
                    value={email}
                    error={error}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                  />
                </Field>
                <button type="submit" className="btn-primary w-full" disabled={submitting}>
                  {submitting && <Spinner className="h-4 w-4" />}
                  {submitting ? 'Sending…' : 'Send reset link'}
                </button>
              </form>

              <Link to="/login" className="mt-6 flex items-center justify-center gap-1.5 text-sm font-semibold text-brand-700 hover:text-brand-800">
                <IconBack className="h-4 w-4" /> Back to sign in
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
