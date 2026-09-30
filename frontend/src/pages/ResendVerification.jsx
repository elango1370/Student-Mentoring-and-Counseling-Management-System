import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Field, TextInput } from '../components/Field.jsx';
import { Spinner } from '../components/States.jsx';
import { IconBack, IconCheck, IconMentor } from '../components/Icons.jsx';
import { isEmail, runValidators } from '../utils/validation.js';

const ResendVerification = () => {
  const { resendVerification } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    const next = runValidators({ email: isEmail(email) });
    setError(next.email || '');
    if (next.email) return;

    setSubmitting(true);
    try {
      const res = await resendVerification(email);
      setSuccessMessage(res.message);
      setSent(true);
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
                <IconCheck className="h-6 w-6" />
              </span>
              <h1 className="mt-4 text-xl font-bold text-ink-900">Check your email</h1>
              <p className="mt-2 text-sm text-ink-500">{successMessage}</p>
              <Link to="/login" className="btn-secondary mt-6 inline-flex w-full items-center justify-center">Back to sign in</Link>
            </div>
          ) : (
            <>
              <div className="mb-6 flex items-start gap-3">
                <span className="rounded-xl bg-brand-50 p-2.5 text-brand-600">
                  <IconMentor className="h-5 w-5" />
                </span>
                <div>
                  <h1 className="text-xl font-bold text-ink-900">Resend verification email</h1>
                  <p className="mt-0.5 text-sm text-ink-500">Enter your email and we'll send a fresh verification link.</p>
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
                  {submitting ? 'Sending…' : 'Resend verification link'}
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

export default ResendVerification;
