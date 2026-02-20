'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, User, Lock, Save, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/providers/AuthProvider';
import api from '@/lib/axios';

export default function TrainerSettingsPage() {
  const { user, checkAuth } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'password'>('profile');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [profileData, setProfileData] = useState({
    fullName: user?.fullName || '',
    email: user?.email || '',
    bio: (user as any)?.bio || '',
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    if (user) {
      setProfileData({
        fullName: user.fullName || '',
        email: user.email || '',
        bio: (user as any)?.bio || '',
      });
    }
  }, [user]);

  async function handleUpdateProfile(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await api.patch('/users/me/profile', {
        fullName: profileData.fullName,
        bio: profileData.bio,
      });
      
      // Update local state immediately with response data
      if (response.data) {
        setProfileData({
          fullName: response.data.fullName || profileData.fullName,
          email: response.data.email || profileData.email,
          bio: response.data.bio || profileData.bio,
        });
      }
      
      // Refresh global user state to update everywhere (sidebar, etc.)
      await checkAuth();
      
      setSuccess('Profile updated successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (e: any) {
      setError(e.response?.data?.message || e.message || 'Error updating profile.');
    } finally {
      setSaving(false);
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('New passwords do not match.');
      setSaving(false);
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      setSaving(false);
      return;
    }

    try {
      await api.patch('/users/me/password', {
        oldPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      
      setSuccess('Password changed successfully!');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setTimeout(() => setSuccess(null), 3000);
    } catch (e: any) {
      setError(e.response?.data?.message || e.message || 'Error changing password.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-foreground">Profile Settings</h1>
        <p className="text-sm sm:text-base text-muted mt-1">Manage your profile information and security</p>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="rounded-lg border border-error/50 bg-error/10 p-3 sm:p-4 text-error text-xs sm:text-sm flex items-center gap-2">
          <AlertCircle size={16} className="sm:w-5 sm:h-5 shrink-0" />
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-lg border border-success/50 bg-success/10 p-3 sm:p-4 text-success text-xs sm:text-sm flex items-center gap-2">
          <CheckCircle2 size={16} className="sm:w-5 sm:h-5 shrink-0" />
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 lg:gap-6">
        {/* Sidebar Navigation */}
        <aside className="lg:col-span-1">
          <div className="rounded-lg border border-border bg-surface p-3 sm:p-4">
            <nav className="space-y-1 sm:space-y-2">
              <button
                onClick={() => setActiveTab('profile')}
                className={`w-full flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 rounded-lg transition-all text-left ${
                  activeTab === 'profile'
                    ? 'bg-secondary text-white shadow-sm'
                    : 'text-muted hover:bg-background hover:text-foreground'
                }`}
              >
                <User size={18} className="sm:w-5 sm:h-5 shrink-0" />
                <span className="font-medium text-xs sm:text-sm">Update Profile</span>
              </button>
              <button
                onClick={() => setActiveTab('password')}
                className={`w-full flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 rounded-lg transition-all text-left ${
                  activeTab === 'password'
                    ? 'bg-secondary text-white shadow-sm'
                    : 'text-muted hover:bg-background hover:text-foreground'
                }`}
              >
                <Lock size={18} className="sm:w-5 sm:h-5 shrink-0" />
                <span className="font-medium text-xs sm:text-sm">Change Password</span>
              </button>
            </nav>
          </div>
        </aside>

        {/* Main Content */}
        <main className="lg:col-span-3">
          <div className="rounded-lg border border-border bg-surface p-4 sm:p-5 lg:p-6">
            {activeTab === 'profile' ? (
              <div>
                <h2 className="text-base sm:text-lg font-semibold text-foreground mb-4 sm:mb-6">Personal Information</h2>
                <form onSubmit={handleUpdateProfile} className="space-y-4 sm:space-y-6">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-foreground mb-1 sm:mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={profileData.fullName}
                      onChange={(e) => setProfileData({ ...profileData, fullName: e.target.value })}
                      className="w-full px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg border border-border bg-background text-foreground text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-foreground mb-1 sm:mb-2">
                        Email
                      </label>
                      <input
                        type="email"
                        value={profileData.email}
                        disabled
                        className="w-full px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg border border-border bg-muted/10 text-muted text-sm sm:text-base cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-foreground mb-1 sm:mb-2">
                        Role
                      </label>
                      <input
                        type="text"
                        value="Trainer"
                        disabled
                        className="w-full px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg border border-border bg-muted/10 text-muted text-sm sm:text-base cursor-not-allowed"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-foreground mb-1 sm:mb-2">
                      Bio
                    </label>
                    <textarea
                      value={profileData.bio}
                      onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                      rows={4}
                      className="w-full px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg border border-border bg-background text-foreground text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary resize-none"
                      placeholder="Tell us about yourself..."
                    />
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      disabled={saving}
                      className="inline-flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-2.5 bg-primary text-white rounded-lg hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm sm:text-base font-medium"
                    >
                      {saving ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save size={16} />
                          Update Profile
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div>
                <h2 className="text-base sm:text-lg font-semibold text-foreground mb-4 sm:mb-6">Security Settings</h2>
                <form onSubmit={handleChangePassword} className="space-y-4 sm:space-y-6 max-w-md">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-foreground mb-1 sm:mb-2">
                      Current Password
                    </label>
                    <input
                      type="password"
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                      placeholder="••••••••"
                      className="w-full px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg border border-border bg-background text-foreground text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-foreground mb-1 sm:mb-2">
                      New Password
                    </label>
                    <input
                      type="password"
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      placeholder="••••••••"
                      className="w-full px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg border border-border bg-background text-foreground text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                      required
                      minLength={6}
                    />
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-foreground mb-1 sm:mb-2">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                      placeholder="••••••••"
                      className="w-full px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg border border-border bg-background text-foreground text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                      required
                      minLength={6}
                    />
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      disabled={saving}
                      className="inline-flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-2.5 bg-error text-white rounded-lg hover:bg-error/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm sm:text-base font-medium"
                    >
                      {saving ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          Changing...
                        </>
                      ) : (
                        <>
                          <Lock size={16} />
                          Change Password
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
