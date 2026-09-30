import { useState } from 'react';
import { authApi, adminApi, mentorApi } from '../api/endpoints.js';
import { useApi } from '../hooks/useApi.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import PageHeader from '../components/PageHeader.jsx';
import Avatar from '../components/Avatar.jsx';
import Badge from '../components/Badge.jsx';
import { Field, TextInput } from '../components/Field.jsx';
import { EmptyState, Spinner } from '../components/States.jsx';
import { IconPlus, IconShield } from '../components/Icons.jsx';
import { formatDateTime, titleCase } from '../utils/format.js';
import { isEmail, isPhone, isStrongPassword, mergeServerErrors, minLength, passwordsMatch, runValidators } from '../utils/validation.js';

const DetailRow = ({ label, value }) => (
  <div className="flex items-start justify-between gap-4 border-b border-ink-100 py-2.5 last:border-0">
    <dt className="text-xs font-medium text-ink-500">{label}</dt>
    <dd className="text-right text-sm font-semibold text-ink-800">{value || '—'}</dd>
  </div>
);

const Profile = () => {
  const { user, role, updateUser, logoutAllDevices } = useAuth();
  const toast = useToast();

  const [profileForm, setProfileForm] = useState({ name: user?.name || '', phone: user?.phone || '' });
  const [profileErrors, setProfileErrors] = useState({});
  const [savingProfile, setSavingProfile] = useState(false);

  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [passwordErrors, setPasswordErrors] = useState({});
  const [savingPassword, setSavingPassword] = useState(false);
  const [loggingOutAll, setLoggingOutAll] = useState(false);

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

  const { data: mentorData } = useApi(mentorApi.myProfile, [], { immediate: role === 'mentor' });
  const mentor = mentorData?.data?.mentor;
  const studentCount = mentorData?.data?.studentCount;

  const { data: adminsData, loading: adminsLoading, refetch: refetchAdmins } = useApi(adminApi.listAdmins, [], { immediate: role === 'admin' });
  const admins = adminsData?.data || [];
  const [adminForm, setAdminForm] = useState({ name: '', email: '', password: '', phone: '' });
  const [adminErrors, setAdminErrors] = useState({});
  const [creatingAdmin, setCreatingAdmin] = useState(false);
  const [statusBusyId, setStatusBusyId] = useState(null);

  const submitAdmin = async (e) => {
    e.preventDefault();
    const next = runValidators({
      name: minLength(adminForm.name, 2, 'Name'),
      email: isEmail(adminForm.email),
      password: minLength(adminForm.password, 6, 'Password'),
      phone: isPhone(adminForm.phone),
    });
    setAdminErrors(next);
    if (Object.keys(next).length > 0) return;

    setCreatingAdmin(true);
    try {
      await adminApi.createAdmin(adminForm);
      toast.success('Administrator account created.');
      setAdminForm({ name: '', email: '', password: '', phone: '' });
      refetchAdmins();
    } catch (err) {
      setAdminErrors((prev) => mergeServerErrors(prev, err.details));
      toast.error(err.message);
    } finally {
      setCreatingAdmin(false);
    }
  };

  const toggleAdminStatus = async (admin) => {
    const nextStatus = admin.status === 'suspended' ? 'active' : 'suspended';
    setStatusBusyId(admin._id);
    try {
      await adminApi.updateAdminStatus(admin._id, nextStatus);
      toast.success(nextStatus === 'active' ? 'Administrator reactivated.' : 'Administrator suspended.');
      refetchAdmins();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setStatusBusyId(null);
    }
  };

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

  return (
    <>
      <PageHeader title="My account" subtitle="Manage your personal details and password." />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="card card-pad">
          <div className="flex items-center gap-4">
            <Avatar name={user?.name} color={user?.avatarColor} size="xl" />
            <div className="min-w-0">
              <p className="truncate text-lg font-bold text-ink-900">{user?.name}</p>
              <p className="truncate text-sm text-ink-500">{user?.email}</p>
              <span className="badge mt-2 bg-brand-100 text-brand-700">{titleCase(role)}</span>
            </div>
          </div>
          <dl className="mt-5">
            <DetailRow label="Phone" value={user?.phone} />
            <DetailRow label="Last login" value={formatDateTime(user?.lastLogin)} />
            {role === 'mentor' && (
              <>
                <DetailRow label="Employee ID" value={mentor?.employeeId} />
                <DetailRow label="Department" value={mentor?.department} />
                <DetailRow label="Designation" value={mentor?.designation} />
                <DetailRow label="Specialization" value={mentor?.specialization} />
                <DetailRow label="Experience" value={mentor ? `${mentor.experienceYears || 0} years` : ''} />
                <DetailRow label="Office" value={mentor?.officeLocation} />
                <DetailRow label="Mentees" value={mentor ? `${studentCount} of ${mentor.maxStudents}` : ''} />
              </>
            )}
          </dl>
        </div>

        <div className="space-y-6 lg:col-span-2">
          <form onSubmit={submitProfile} className="card card-pad space-y-4">
            <div>
              <h2 className="text-sm font-semibold text-ink-900">Personal details</h2>
              <p className="mt-1 text-xs text-ink-500">Your name appears on every record you create.</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Full name" error={profileErrors.name} required>
                <TextInput value={profileForm.name} error={profileErrors.name} onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })} />
              </Field>
              <Field label="Phone" error={profileErrors.phone}>
                <TextInput value={profileForm.phone} error={profileErrors.phone} onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })} />
              </Field>
              <Field label="Email" hint="Contact an administrator to change your email address." className="sm:col-span-2">
                <TextInput value={user?.email || ''} disabled readOnly />
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

          {role === 'admin' && (
            <div className="card card-pad space-y-5">
              <div>
                <h2 className="flex items-center gap-2 text-sm font-semibold text-ink-900">
                  <IconShield className="h-4 w-4 text-brand-600" /> Administrator accounts
                </h2>
                <p className="mt-1 text-xs text-ink-500">
                  Only an existing administrator can create another. There is no public sign-up for this role.
                </p>
              </div>

              {admins.length === 0 && !adminsLoading ? (
                <EmptyState title="No other administrators" message="You are currently the only administrator." />
              ) : (
                <ul className="divide-y divide-ink-100 rounded-xl border border-ink-200">
                  {admins.map((a) => (
                    <li key={a._id} className="flex items-center justify-between gap-3 px-4 py-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-sm font-semibold text-ink-800">{a.name}</p>
                          {a._id === user?.id && <span className="badge bg-brand-100 text-brand-700">You</span>}
                        </div>
                        <p className="truncate text-xs text-ink-500">{a.email}</p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <Badge value={a.status || 'active'} />
                        {a._id !== user?.id && (
                          <button
                            type="button"
                            className="btn-ghost btn-sm"
                            disabled={statusBusyId === a._id}
                            onClick={() => toggleAdminStatus(a)}
                          >
                            {statusBusyId === a._id && <Spinner className="h-4 w-4" />}
                            {a.status === 'suspended' ? 'Reactivate' : 'Suspend'}
                          </button>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}

              <form onSubmit={submitAdmin} className="space-y-4 border-t border-ink-100 pt-5">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-500">Create a new administrator</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Full name" error={adminErrors.name} required>
                    <TextInput value={adminForm.name} error={adminErrors.name} onChange={(e) => setAdminForm({ ...adminForm, name: e.target.value })} />
                  </Field>
                  <Field label="Email" error={adminErrors.email} required>
                    <TextInput type="email" value={adminForm.email} error={adminErrors.email} onChange={(e) => setAdminForm({ ...adminForm, email: e.target.value })} />
                  </Field>
                  <Field label="Password" error={adminErrors.password} required hint="Minimum 6 characters">
                    <TextInput type="password" autoComplete="new-password" value={adminForm.password} error={adminErrors.password} onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })} />
                  </Field>
                  <Field label="Phone" error={adminErrors.phone}>
                    <TextInput value={adminForm.phone} error={adminErrors.phone} onChange={(e) => setAdminForm({ ...adminForm, phone: e.target.value })} />
                  </Field>
                </div>
                <div className="flex justify-end">
                  <button type="submit" className="btn-primary" disabled={creatingAdmin}>
                    {creatingAdmin ? <Spinner className="h-4 w-4" /> : <IconPlus className="h-4 w-4" />} Create administrator
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Profile;
