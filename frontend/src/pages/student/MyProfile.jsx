import { useState } from 'react';
import { authApi, studentApi } from '../../api/endpoints.js';
import { useApi } from '../../hooks/useApi.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import Avatar from '../../components/Avatar.jsx';
import Badge from '../../components/Badge.jsx';
import { Field, TextInput } from '../../components/Field.jsx';
import { EmptyState, ErrorState, LoadingState, Spinner } from '../../components/States.jsx';
import { IconMentor } from '../../components/Icons.jsx';
import { formatDate, titleCase } from '../../utils/format.js';
import { isPhone, isStrongPassword, mergeServerErrors, minLength, passwordsMatch, runValidators } from '../../utils/validation.js';

const DetailRow = ({ label, value }) => (
  <div className="flex items-start justify-between gap-4 border-b border-ink-100 py-2.5 last:border-0">
    <dt className="text-xs font-medium text-ink-500">{label}</dt>
    <dd className="text-right text-sm font-semibold text-ink-800">{value || '—'}</dd>
  </div>
);

const MyProfile = () => {
  const { user, updateUser, logoutAllDevices } = useAuth();
  const toast = useToast();
  const { data, loading, error, refetch } = useApi(studentApi.me, []);

  const [profileForm, setProfileForm] = useState({ name: user?.name || '', phone: user?.phone || '' });
  const [profileErrors, setProfileErrors] = useState({});
  const [savingProfile, setSavingProfile] = useState(false);

  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [passwordErrors, setPasswordErrors] = useState({});
  const [savingPassword, setSavingPassword] = useState(false);
  const [loggingOutAll, setLoggingOutAll] = useState(false);

  const submitProfile = async (e) => {
    e.preventDefault();
    const next = runValidators({
      name: minLength(profileForm.name, 2, 'Name'),
      phone: isPhone(profileForm.phone),
    });
    setProfileErrors(next);
    if (Object.keys(next).length > 0) return;

    setSavingProfile(true);
    try {
      const res = await authApi.updateProfile(profileForm);
      updateUser(res.user);
      toast.success('Profile updated.');
      refetch();
    } catch (err) {
      setProfileErrors((prev) => mergeServerErrors(prev, err.details));
      toast.error(err.message);
    } finally {
      setSavingProfile(false);
    }
  };

  const submitPassword = async (e) => {
    e.preventDefault();
    const next = runValidators({
      currentPassword: minLength(passwordForm.currentPassword, 1, 'Current password'),
      newPassword: isStrongPassword(passwordForm.newPassword),
      confirmPassword: passwordsMatch(passwordForm.newPassword, passwordForm.confirmPassword),
    });
    setPasswordErrors(next);
    if (Object.keys(next).length > 0) return;

    setSavingPassword(true);
    try {
      await authApi.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      toast.success('Password updated.');
    } catch (err) {
      setPasswordErrors((prev) => mergeServerErrors(prev, err.details));
      toast.error(err.message);
    } finally {
      setSavingPassword(false);
    }
  };

  const handleLogoutAllDevices = async () => {
    setLoggingOutAll(true);
    try {
      await logoutAllDevices();
      toast.success('Logged out of all devices. Please sign in again.');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoggingOutAll(false);
    }
  };

  if (loading) return <LoadingState label="Loading your profile…" />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;

  const student = data?.data;
  if (!student) return <EmptyState title="Profile unavailable" message="Your student record could not be loaded." />;

  return (
    <>
      <PageHeader title="My profile" subtitle="Your enrolment details, mentor and account settings." />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6">
          <div className="card card-pad">
            <div className="flex items-center gap-4">
              <Avatar name={student.user?.name} color={student.user?.avatarColor} size="xl" />
              <div className="min-w-0">
                <p className="truncate text-lg font-bold text-ink-900">{student.user?.name}</p>
                <p className="truncate text-sm text-ink-500">{student.user?.email}</p>
                <div className="mt-2"><Badge value={student.status} /></div>
              </div>
            </div>
            <dl className="mt-5">
              <DetailRow label="Roll number" value={student.rollNumber} />
              <DetailRow label="Register number" value={student.registerNumber} />
              <DetailRow label="Department" value={student.department} />
              <DetailRow label="Programme" value={student.program} />
              <DetailRow label="Year" value={student.year ? `Year ${student.year}` : ''} />
              <DetailRow label="Semester" value={student.semester ? `Semester ${student.semester}` : ''} />
              <DetailRow label="Section" value={student.section} />
              <DetailRow label="Admission year" value={student.admissionYear} />
              <DetailRow label="Date of birth" value={formatDate(student.dateOfBirth)} />
              <DetailRow label="Gender" value={student.gender ? titleCase(student.gender) : ''} />
              <DetailRow label="Blood group" value={student.bloodGroup} />
              <DetailRow label="Guardian" value={student.guardianName} />
              <DetailRow label="Guardian phone" value={student.guardianPhone} />
              <DetailRow label="Hostel resident" value={student.hostelResident ? 'Yes' : 'No'} />
              <DetailRow label="Address" value={student.address} />
            </dl>
          </div>

          <div className="card card-pad">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-ink-900">
              <IconMentor className="h-4 w-4 text-brand-600" /> My mentor
            </h2>
            {student.mentor ? (
              <dl className="mt-3">
                <DetailRow label="Name" value={student.mentor.user?.name} />
                <DetailRow label="Email" value={student.mentor.user?.email} />
                <DetailRow label="Phone" value={student.mentor.user?.phone} />
                <DetailRow label="Department" value={student.mentor.department} />
                <DetailRow label="Designation" value={student.mentor.designation} />
                <DetailRow label="Office" value={student.mentor.officeLocation} />
              </dl>
            ) : (
              <p className="mt-3 text-sm text-ink-500">Mentor not assigned. An administrator will assign you a faculty mentor soon.</p>
            )}
          </div>
        </div>

        <div className="space-y-6 lg:col-span-2">
          <form onSubmit={submitProfile} className="card card-pad space-y-4">
            <div>
              <h2 className="text-sm font-semibold text-ink-900">Contact details</h2>
              <p className="mt-1 text-xs text-ink-500">Academic details are maintained by your department office.</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Full name" error={profileErrors.name} required>
                <TextInput value={profileForm.name} error={profileErrors.name} onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })} />
              </Field>
              <Field label="Phone" error={profileErrors.phone}>
                <TextInput value={profileForm.phone} error={profileErrors.phone} onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })} />
              </Field>
              <Field label="Email" hint="Contact your administrator to change your email address." className="sm:col-span-2">
                <TextInput value={student.user?.email || ''} disabled readOnly />
              </Field>
            </div>
            <div className="flex justify-end">
              <button type="submit" className="btn-primary" disabled={savingProfile}>
                {savingProfile && <Spinner className="h-4 w-4" />} Save changes
              </button>
            </div>
          </form>

          <form onSubmit={submitPassword} className="card card-pad space-y-4">
            <div>
              <h2 className="text-sm font-semibold text-ink-900">Change password</h2>
              <p className="mt-1 text-xs text-ink-500">At least 8 characters, with an uppercase letter, a lowercase letter and a number.</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Current password" error={passwordErrors.currentPassword} required>
                <TextInput type="password" autoComplete="current-password" value={passwordForm.currentPassword} error={passwordErrors.currentPassword} onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })} />
              </Field>
              <Field label="New password" error={passwordErrors.newPassword} required>
                <TextInput type="password" autoComplete="new-password" value={passwordForm.newPassword} error={passwordErrors.newPassword} onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })} />
              </Field>
              <Field label="Confirm new password" error={passwordErrors.confirmPassword} required>
                <TextInput type="password" autoComplete="new-password" value={passwordForm.confirmPassword} error={passwordErrors.confirmPassword} onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })} />
              </Field>
            </div>
            <div className="flex justify-end">
              <button type="submit" className="btn-primary" disabled={savingPassword}>
                {savingPassword && <Spinner className="h-4 w-4" />} Update password
              </button>
            </div>
          </form>

          <div className="card card-pad flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-sm font-semibold text-ink-900">Security</h2>
              <p className="mt-1 text-xs text-ink-500">Sign out of every device where you're currently logged in.</p>
            </div>
            <button type="button" className="btn-secondary shrink-0" disabled={loggingOutAll} onClick={handleLogoutAllDevices}>
              {loggingOutAll && <Spinner className="h-4 w-4" />} Log out of all devices
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default MyProfile;
