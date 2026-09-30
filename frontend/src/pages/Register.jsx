import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { metaApi } from '../api/endpoints.js';
import { useApi } from '../hooks/useApi.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { Field, Select, TextInput } from '../components/Field.jsx';
import { Spinner } from '../components/States.jsx';
import { IconChart, IconMail, IconShield, IconUser, IconUsers } from '../components/Icons.jsx';
import { isEmail, isPhone, isStrongPassword, mergeServerErrors, minLength, passwordsMatch, required, runValidators } from '../utils/validation.js';
import { SEMESTERS, YEARS } from '../utils/constants.js';

const HIGHLIGHTS = [
  { icon: IconUsers, title: 'Assigned mentoring', text: 'An administrator pairs you with a faculty mentor once your account is live.' },
  { icon: IconChart, title: 'Progress at a glance', text: 'Track your marks, grades and attendance percentage in one place.' },
  { icon: IconShield, title: 'Support you can follow', text: 'See counseling sessions, remarks and interventions recorded for you.' },
];

const emptyForm = {
  name: '', email: '', password: '', confirmPassword: '', phone: '',
  rollNumber: '', registerNumber: '', department: '', program: 'B.E.',
  year: '', semester: '', section: 'A', admissionYear: new Date().getFullYear(),
};

const Register = () => {
  const { register, isAuthenticated, initialising } = useAuth();
  const toast = useToast();

  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const { data: deptData } = useApi(metaApi.publicDepartments, []);
  const departments = deptData?.data || [];

  if (!initialising && isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const validate = () => {
    const next = runValidators({
      name: minLength(form.name, 2, 'Name'),
      email: isEmail(form.email),
      password: isStrongPassword(form.password),
      confirmPassword: passwordsMatch(form.password, form.confirmPassword),
      rollNumber: required(form.rollNumber, 'Roll number'),
      department: required(form.department, 'Department'),
      year: required(form.year, 'Year'),
      semester: required(form.semester, 'Semester'),
      phone: isPhone(form.phone),
    });
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      const { confirmPassword, ...payload } = form;
      const res = await register({
        ...payload,
        year: Number(payload.year),
        semester: Number(payload.semester),
        admissionYear: Number(payload.admissionYear) || new Date().getFullYear(),
      });
      setSubmitted(true);
      toast.success(res.message || 'Account created. Check your email to verify it.');
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
            Create your student account in under a minute.
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
          Mentor and administrator accounts are provisioned by your institution.
        </p>
      </div>

      <div className="flex items-center justify-center bg-ink-50 px-5 py-12 sm:px-8">
        <div className="w-full max-w-xl">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-sm font-bold text-white">SM</span>
            <div>
              <p className="text-sm font-bold text-ink-900">SMCMS</p>
              <p className="text-xs text-ink-500">Student Mentoring &amp; Counseling</p>
            </div>
          </div>

          {submitted ? (
            <div className="card card-pad text-center">
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                <IconMail className="h-6 w-6" />
              </span>
              <h1 className="mt-4 text-xl font-bold text-ink-900">Check your email</h1>
              <p className="mt-2 text-sm text-ink-500">
                Thanks, {form.name.split(' ')[0]}. We've sent a verification link to <strong>{form.email}</strong>.
                Verify your address, then sign in.
              </p>
              <Link to="/login" className="btn-primary mt-6 inline-flex w-full items-center justify-center">Go to sign in</Link>
              <p className="mt-3 text-xs text-ink-500">
                Didn't get it?{' '}
                <Link to="/resend-verification" className="font-semibold text-brand-700 hover:text-brand-800">Resend verification email</Link>
              </p>
            </div>
          ) : (
          <div className="card card-pad">
            <div className="mb-6 flex items-start gap-3">
              <span className="rounded-xl bg-brand-50 p-2.5 text-brand-600">
                <IconUser className="h-5 w-5" />
              </span>
              <div>
                <h1 className="text-xl font-bold text-ink-900">Create account</h1>
                <p className="mt-0.5 text-sm text-ink-500">Register as a student with your enrolment details.</p>
              </div>
            </div>

            <form onSubmit={submit} className="space-y-5" noValidate>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Full name" error={errors.name} required>
                  <TextInput value={form.name} error={errors.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </Field>
                <Field label="Email address" error={errors.email} required hint="Use your own personal email (e.g. Gmail) — you'll need to verify it.">
                  <TextInput type="email" autoComplete="email" value={form.email} error={errors.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@gmail.com" />
                </Field>
                <Field label="Password" error={errors.password} required hint="At least 8 characters, with an uppercase letter, a lowercase letter and a number">
                  <TextInput type="password" autoComplete="new-password" value={form.password} error={errors.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
                </Field>
                <Field label="Confirm password" error={errors.confirmPassword} required>
                  <TextInput type="password" autoComplete="new-password" value={form.confirmPassword} error={errors.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} />
                </Field>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Field label="Roll number" error={errors.rollNumber} required>
                  <TextInput value={form.rollNumber} error={errors.rollNumber} onChange={(e) => setForm({ ...form, rollNumber: e.target.value })} />
                </Field>
                <Field label="Register number">
                  <TextInput value={form.registerNumber} onChange={(e) => setForm({ ...form, registerNumber: e.target.value })} />
                </Field>
                <Field label="Department" error={errors.department} required>
                  <TextInput list="register-department-list" value={form.department} error={errors.department} onChange={(e) => setForm({ ...form, department: e.target.value })} />
                  <datalist id="register-department-list">
                    {departments.map((d) => <option key={d} value={d} />)}
                  </datalist>
                </Field>
                <Field label="Programme">
                  <TextInput value={form.program} onChange={(e) => setForm({ ...form, program: e.target.value })} />
                </Field>
                <Field label="Year" error={errors.year} required>
                  <Select value={form.year} error={errors.year} onChange={(e) => setForm({ ...form, year: e.target.value })}>
                    <option value="">Select year</option>
                    {YEARS.map((y) => <option key={y} value={y}>Year {y}</option>)}
                  </Select>
                </Field>
                <Field label="Semester" error={errors.semester} required>
                  <Select value={form.semester} error={errors.semester} onChange={(e) => setForm({ ...form, semester: e.target.value })}>
                    <option value="">Select semester</option>
                    {SEMESTERS.map((s) => <option key={s} value={s}>Semester {s}</option>)}
                  </Select>
                </Field>
                <Field label="Section">
                  <TextInput value={form.section} onChange={(e) => setForm({ ...form, section: e.target.value })} />
                </Field>
                <Field label="Admission year">
                  <TextInput type="number" value={form.admissionYear} onChange={(e) => setForm({ ...form, admissionYear: e.target.value })} />
                </Field>
                <Field label="Phone" error={errors.phone}>
                  <TextInput value={form.phone} error={errors.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                </Field>
              </div>

              <button type="submit" className="btn-primary w-full" disabled={submitting}>
                {submitting && <Spinner className="h-4 w-4" />}
                {submitting ? 'Creating account…' : 'Create account'}
              </button>
            </form>
          </div>
          )}

          {!submitted && (
          <>
          <p className="mt-6 text-center text-sm text-ink-500">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-brand-700 hover:text-brand-800">Sign in</Link>
          </p>
          <p className="mt-2 text-center text-xs text-ink-500">
            Faculty or mentor accounts are created by an administrator — contact your department administrator.
          </p>
          </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Register;
