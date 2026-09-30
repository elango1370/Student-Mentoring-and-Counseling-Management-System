import { useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { Field, TextInput } from '../components/Field.jsx';
import { Spinner } from '../components/States.jsx';
import { IconBack, IconCheck, IconShield } from '../components/Icons.jsx';
import { isStrongPassword, passwordsMatch, runValidators } from '../utils/validation.js';

const ResetPassword = () => {
  const { resetPassword, isAuthenticated, initialising } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';

  const [form, setForm] = useState({ password: '', confirmPassword: '' });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  if (!initialising && isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink-50 px-5 py-12 sm:px-8">
        <div className="w-full max-w-md card card-pad text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
            <IconShield className="h-6 w-6" />
          </span>
          <h1 className="mt-4 text-xl font-bold text-ink-900">Invalid link</h1>
          <p className="mt-2 text-sm text-ink-500">This password reset link is missing its token. Request a new one.</p>
          <Link to="/forgot-password" className="btn-primary mt-6 inline-flex w-full items-center justify-center">Request a new link</Link>
        </div>
      </div>
    );
  }

  const validate = () => {
    const next = runValidators({
      password: isStrongPassword(form.password),
      confirmPassword: passwordsMatch(form.password, form.confirmPassword),
    });
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      await resetPassword({ token, newPassword: form.password });
      setDone(true);
      toast.success('Password reset. Please sign in with your new password.');
    } catch (err) {
      toast.error(err.message);
      setErrors({ password: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-50 px-5 py-12 sm:px-8">
      <div className="w-full max-w-md">
        <div className="mb-8 flex items-center justify-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-sm font-bold text-white">SM</span>
          <div>
            <p className="text-sm font-bold text-ink-900">SMCMS</p>
            <p className="text-xs text-ink-500">Student Mentoring &amp; Counseling</p>
          </div>
        </div>

        <div className="card card-pad">
          {done ? (
            <div className="text-center">
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                <IconCheck className="h-6 w-6" />
              </span>
              <h1 className="mt-4 text-xl font-bold text-ink-900">Password reset</h1>
              <p className="mt-2 text-sm text-ink-500">
                You've been signed out everywhere for security. Sign in again with your new password.
              </p>
              <button type="button" className="btn-primary mt-6 w-full" onClick={() => navigate('/login')}>
                Go to sign in
              </button>
            </div>
          ) : (
            <>
              <div className="mb-6 flex items-start gap-3">
                <span className="rounded-xl bg-brand-50 p-2.5 text-brand-600">
                  <IconShield className="h-5 w-5" />
                </span>
                <div>
                  <h1 className="text-xl font-bold text-ink-900">Set a new password</h1>
                  <p className="mt-0.5 text-sm text-ink-500">This link can only be used once and expires shortly.</p>
                </div>
              </div>

              <form onSubmit={submit} className="space-y-4" noValidate>
                <Field label="New password" error={errors.password} required hint="At least 8 characters, with an uppercase letter, a lowercase letter and a number">
                  <TextInput
                    type="password"
                    autoComplete="new-password"
                    value={form.password}
                    error={errors.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                  />
                </Field>
                <Field label="Confirm new password" error={errors.confirmPassword} required>
                  <TextInput
                    type="password"
                    autoComplete="new-password"
                    value={form.confirmPassword}
                    error={errors.confirmPassword}
                    onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                  />
                </Field>
                <button type="submit" className="btn-primary w-full" disabled={submitting}>
                  {submitting && <Spinner className="h-4 w-4" />}
                  {submitting ? 'Resetting…' : 'Reset password'}
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

export default ResetPassword;
