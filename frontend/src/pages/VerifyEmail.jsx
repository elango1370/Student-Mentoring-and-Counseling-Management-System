import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Spinner } from '../components/States.jsx';
import { IconCheck, IconClose, IconShield } from '../components/Icons.jsx';

const VerifyEmail = () => {
  const { verifyEmail } = useAuth();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const ranOnce = useRef(false);

  const [status, setStatus] = useState(token ? 'checking' : 'missing');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token || ranOnce.current) return;
    ranOnce.current = true;

    (async () => {
      try {
        const res = await verifyEmail(token);
        setMessage(res.message);
        setStatus('success');
      } catch (err) {
        setMessage(err.message);
        setStatus('error');
      }
    })();
  }, [token, verifyEmail]);

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

        <div className="card card-pad text-center">
          {status === 'checking' && (
            <>
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-brand-600">
                <Spinner className="h-6 w-6" />
              </span>
              <h1 className="mt-4 text-xl font-bold text-ink-900">Verifying your email…</h1>
              <p className="mt-2 text-sm text-ink-500">This will just take a moment.</p>
            </>
          )}

          {status === 'success' && (
            <>
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                <IconCheck className="h-6 w-6" />
              </span>
              <h1 className="mt-4 text-xl font-bold text-ink-900">Email verified</h1>
              <p className="mt-2 text-sm text-ink-500">{message}</p>
              <Link to="/login" className="btn-primary mt-6 inline-flex w-full items-center justify-center">Go to sign in</Link>
            </>
          )}

          {status === 'error' && (
            <>
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
                <IconClose className="h-6 w-6" />
              </span>
              <h1 className="mt-4 text-xl font-bold text-ink-900">Verification failed</h1>
              <p className="mt-2 text-sm text-ink-500">{message}</p>
              <Link to="/resend-verification" className="btn-primary mt-6 inline-flex w-full items-center justify-center">Request a new link</Link>
              <Link to="/login" className="mt-3 block text-sm font-semibold text-brand-700 hover:text-brand-800">Back to sign in</Link>
            </>
          )}

          {status === 'missing' && (
            <>
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
                <IconShield className="h-6 w-6" />
              </span>
              <h1 className="mt-4 text-xl font-bold text-ink-900">Invalid link</h1>
              <p className="mt-2 text-sm text-ink-500">This verification link is missing its token.</p>
              <Link to="/resend-verification" className="btn-primary mt-6 inline-flex w-full items-center justify-center">Request a new link</Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
