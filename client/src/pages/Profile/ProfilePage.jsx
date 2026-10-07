import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { profileService } from '../../services/profileService';
import { toast } from 'sonner';
import PasswordStrengthMeter from '../../components/common/PasswordStrengthMeter';
import OtpInput from '../../components/common/OtpInput';

import {
  User,
  Mail,
  Phone,
  Building2,
  Shield,
  Key,
  Camera,
  CheckCircle2,
  AlertTriangle,
  Clock,
  MapPin,
  Globe,
  Settings,
  Monitor,
  Trash2,
  RefreshCw,
  Eye,
  EyeOff,
  Lock,
  Save,
  X,
  FileCheck,
  Check,
  ShieldCheck,
  Info
} from 'lucide-react';

const ProfilePage = ({ isSuperAdmin = false }) => {
  const { user, superAdmin } = useAuth();
  const fileInputRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('overview'); // overview, personal, security, preferences, employment
  const [profile, setProfile] = useState(null);

  // Forms state
  const [personalForm, setPersonalForm] = useState({
    name: '',
    username: '',
    phone: '',
    officeLocation: '',
    timeZone: 'Asia/Kolkata',
    dateFormat: 'DD/MM/YYYY'
  });
  const [hasUnsavedPersonal, setHasUnsavedPersonal] = useState(false);

  // Avatar Upload State
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);

  // Email Change Step-Up Verification Modal State
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailStep, setEmailStep] = useState(1); // 1: Password & New Email, 2: OTP
  const [emailForm, setEmailForm] = useState({ currentPassword: '', newEmail: '' });
  const [emailOtp, setEmailOtp] = useState('');
  const [emailVerifying, setEmailVerifying] = useState(false);

  // Password Change State
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [changingPass, setChangingPass] = useState(false);

  // Preferences State
  const [preferences, setPreferences] = useState({
    notificationPreferences: { emailGatePass: true, emailApprovals: true, emailSystem: true },
    displayPreferences: { pageSize: 10, compactMode: false }
  });

  const effectiveIsSuperAdmin = isSuperAdmin || Boolean(superAdmin) || window.location.pathname.startsWith('/superadmin');

  // Fetch Profile Data
  const loadProfile = async () => {
    setLoading(true);
    const fallbackUser = effectiveIsSuperAdmin ? superAdmin : user;

    // Immediately seed with fallback context user so UI is never blank
    if (fallbackUser) {
      setProfile(fallbackUser);
      setPersonalForm({
        name: fallbackUser.name || '',
        username: fallbackUser.username || (fallbackUser.email && fallbackUser.email.includes('@') ? fallbackUser.email.split('@')[0] : (fallbackUser.phone || 'user')),
        phone: fallbackUser.phone || '',
        officeLocation: fallbackUser.officeLocation || (effectiveIsSuperAdmin ? 'Corporate HQ' : 'Main Plant'),
        timeZone: fallbackUser.timeZone || 'Asia/Kolkata',
        dateFormat: fallbackUser.dateFormat || 'DD/MM/YYYY'
      });
    }

    try {
      if (effectiveIsSuperAdmin) {
        const res = await profileService.getSuperAdminProfile();
        if (res?.success && res?.profile) {
          setProfile(res.profile);
          setPersonalForm({
            name: res.profile.name || '',
            username: (res.profile.email && res.profile.email.includes('@') ? res.profile.email.split('@')[0] : 'admin'),
            phone: res.profile.phone || '',
            officeLocation: res.profile.officeLocation || 'Corporate HQ',
            timeZone: res.profile.timeZone || 'Asia/Kolkata',
            dateFormat: res.profile.dateFormat || 'DD/MM/YYYY'
          });
        }
      } else {
        const res = await profileService.getProfile();
        if (res?.success && res?.profile) {
          setProfile(res.profile);
          setPersonalForm({
            name: res.profile.name || '',
            username: res.profile.username || (res.profile.email && res.profile.email.includes('@') ? res.profile.email.split('@')[0] : (res.profile.phone || 'user')),
            phone: res.profile.phone || '',
            officeLocation: res.profile.officeLocation || 'Main Plant',
            timeZone: res.profile.timeZone || 'Asia/Kolkata',
            dateFormat: res.profile.dateFormat || 'DD/MM/YYYY'
          });
          if (res.profile.notificationPreferences || res.profile.displayPreferences) {
            setPreferences({
              notificationPreferences: res.profile.notificationPreferences || { emailGatePass: true, emailApprovals: true, emailSystem: true },
              displayPreferences: res.profile.displayPreferences || { pageSize: 10, compactMode: false }
            });
          }
        }
      }
    } catch (err) {
      console.warn('Profile API call failed, using session context:', err);
      // If fallback user was not available, warn user
      if (!fallbackUser) {
        toast.error('Failed to load user profile information.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, [effectiveIsSuperAdmin]);

  // Handle Unsaved Changes Warning
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasUnsavedPersonal) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedPersonal]);

  const handlePersonalChange = (field, value) => {
    setPersonalForm((prev) => ({ ...prev, [field]: value }));
    setHasUnsavedPersonal(true);
  };

  const handleSavePersonal = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const apiCall = effectiveIsSuperAdmin
        ? profileService.updateSuperAdminPersonal(personalForm)
        : profileService.updatePersonalInfo(personalForm);
      const res = await apiCall;
      if (res.success) {
        toast.success('Personal profile updated successfully!');
        setHasUnsavedPersonal(false);
        loadProfile();
      } else {
        toast.error(res.message || 'Failed to update profile.');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error saving personal profile.');
    } finally {
      setSaving(false);
    }
  };

  // Avatar Selection & Security Client Validation
  const handleAvatarFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // File Type Check
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type.toLowerCase())) {
      toast.error('Security Check: Only JPEG, PNG, and WebP image formats are permitted.');
      return;
    }

    // Size check (<2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('File Size Check: Avatar image must be less than 2MB.');
      return;
    }

    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = () => setAvatarPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleUploadAvatarConfirm = async () => {
    if (!avatarFile) return;
    setSaving(true);
    try {
      const apiCall = effectiveIsSuperAdmin
        ? profileService.uploadSuperAdminAvatar(avatarFile)
        : profileService.uploadAvatar(avatarFile);
      const res = await apiCall;
      if (res.success) {
        toast.success('Profile picture uploaded and processed securely!');
        setAvatarPreview(null);
        setAvatarFile(null);
        loadProfile();
      } else {
        toast.error(res.message || 'Avatar upload failed.');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error uploading profile picture.');
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveAvatar = async () => {
    if (!window.confirm('Remove profile picture and restore default initials avatar?')) return;
    setSaving(true);
    try {
      const res = effectiveIsSuperAdmin
        ? await profileService.removeSuperAdminAvatar()
        : await profileService.removeAvatar();
      if (res?.success) {
        toast.success('Profile picture removed.');
        setAvatarPreview(null);
        setAvatarFile(null);
        loadProfile();
      } else {
        toast.error(res?.message || 'Failed to remove profile picture.');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove profile picture.');
    } finally {
      setSaving(false);
    }
  };

  // Step-Up Verification: Request Email Change
  const handleRequestEmailChange = async (e) => {
    e.preventDefault();
    if (!emailForm.currentPassword || !emailForm.newEmail) {
      toast.error('Please enter your current password and new email address.');
      return;
    }
    setEmailVerifying(true);
    try {
      const res = await profileService.requestEmailChange(emailForm.currentPassword, emailForm.newEmail);
      if (res.success) {
        toast.success(res.message);
        setEmailStep(2);
      } else {
        toast.error(res.message || 'Failed to request email change.');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error requesting email change.');
    } finally {
      setEmailVerifying(false);
    }
  };

  // Step-Up Verification: Verify Email Change OTP
  const handleVerifyEmailOTP = async (e) => {
    e.preventDefault();
    if (!emailOtp || emailOtp.length < 6) {
      toast.error('Please enter the 6-digit verification code.');
      return;
    }
    setEmailVerifying(true);
    try {
      const res = await profileService.verifyEmailChange(emailOtp);
      if (res.success) {
        toast.success(res.message);
        setShowEmailModal(false);
        setEmailForm({ currentPassword: '', newEmail: '' });
        setEmailOtp('');
        setEmailStep(1);
        loadProfile();
      } else {
        toast.error(res.message || 'OTP verification failed.');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error verifying OTP.');
    } finally {
      setEmailVerifying(false);
    }
  };

  // Change Password Submission
  const handleChangePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('New password and confirmation password do not match.');
      return;
    }
    if (passwordForm.newPassword.length < 8) {
      toast.error('Password must be at least 8 characters long.');
      return;
    }
    setChangingPass(true);
    try {
      const apiCall = effectiveIsSuperAdmin
        ? profileService.changeSuperAdminPassword(passwordForm.currentPassword, passwordForm.newPassword)
        : profileService.changePassword(passwordForm.currentPassword, passwordForm.newPassword);
      const res = await apiCall;
      if (res.success) {
        toast.success(res.message);
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        loadProfile();
      } else {
        toast.error(res.message || 'Password change failed.');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error changing password.');
    } finally {
      setChangingPass(false);
    }
  };

  // Optimistic Preference Toggles
  const handleToggleNotification = (key) => {
    const updated = {
      ...preferences.notificationPreferences,
      [key]: !preferences.notificationPreferences[key]
    };
    setPreferences((prev) => ({ ...prev, notificationPreferences: updated }));
    profileService.updatePreferences({ notificationPreferences: updated }).catch(() => {
      toast.error('Failed to save preference.');
      loadProfile();
    });
  };

  if (loading) {
    return (
      <div className="p-8 max-w-5xl mx-auto space-y-6 animate-pulse">
        <div className="h-24 bg-white border border-[#EBEFF2] rounded-xl"></div>
        <div className="h-64 bg-white border border-[#EBEFF2] rounded-xl"></div>
      </div>
    );
  }

  const currentUser = profile || user || superAdmin;
  const initials = currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'U';

  return (
    <div className="pb-12 max-w-6xl mx-auto space-y-6 min-w-0">
      {/* 1. Header Overview Banner */}
      <div className="glass-card bg-white border border-[#EBEFF2] rounded-xl p-5 sm:p-6 shadow-2xs">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Avatar & User Details */}
          <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
            <div className="relative group">
              <div className="w-20 h-20 rounded-full bg-[#111827] text-white font-extrabold text-2xl flex items-center justify-center overflow-hidden border-2 border-white shadow-md">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Preview" className="w-full h-full object-cover" />
                ) : currentUser?.avatarUrl ? (
                  <img src={currentUser.avatarUrl} alt={currentUser.name} className="w-full h-full object-cover" />
                ) : (
                  <span>{initials}</span>
                )}
              </div>

              {/* Upload & Remove Overlay Buttons */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 p-1.5 bg-[#111827] text-white rounded-full hover:bg-[#1F2937] transition-all cursor-pointer shadow-xs"
                title="Change Profile Picture"
              >
                <Camera size={14} />
              </button>
              {currentUser?.avatarUrl && !avatarPreview && (
                <button
                  type="button"
                  onClick={handleRemoveAvatar}
                  disabled={saving}
                  className="absolute bottom-0 -left-1 p-1.5 bg-[#EF4444] text-white rounded-full hover:bg-[#DC2626] transition-all cursor-pointer shadow-xs"
                  title="Remove Profile Picture"
                >
                  <Trash2 size={12} />
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleAvatarFileSelect}
              />
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                <h2 className="font-display text-xl sm:text-2xl font-extrabold text-[#111827]">
                  {currentUser?.name}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#DCFCE7] text-[#10B981] border border-[#DCFCE7]">
                  Active Account
                </span>
                {currentUser?.isEmailVerified && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#ECEAFE] text-[#7C3AED] flex items-center gap-1">
                    <ShieldCheck size={12} /> Verified
                  </span>
                )}
              </div>

              <div className="text-xs text-[#6B7280] font-medium flex items-center justify-center sm:justify-start gap-3 flex-wrap">
                <span>@{currentUser?.username || (currentUser?.email && currentUser.email.includes('@') ? currentUser.email.split('@')[0] : (currentUser?.phone || 'user'))}</span>
                <span>•</span>
                <span>{currentUser?.roleName || currentUser?.designation || 'Enterprise Account'}</span>
                <span>•</span>
                <span>{currentUser?.company?.name || 'Maruti Denim Group'}</span>
              </div>
            </div>
          </div>

          {/* Confirm Avatar Upload or Remove Picture Action */}
          {avatarPreview ? (
            <div className="flex items-center gap-2 bg-[#F6F8FA] p-2.5 rounded-xl border border-[#EBEFF2]">
              <span className="text-xs font-semibold text-[#111827]">New Avatar Selected</span>
              <button
                onClick={handleUploadAvatarConfirm}
                disabled={saving}
                className="px-3 py-1.5 bg-[#111827] hover:bg-[#1F2937] text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
              >
                Save Picture
              </button>
              <button
                onClick={() => {
                  setAvatarPreview(null);
                  setAvatarFile(null);
                }}
                className="p-1.5 text-[#6B7280] hover:text-[#EF4444]"
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            currentUser?.avatarUrl && (
              <button
                type="button"
                onClick={handleRemoveAvatar}
                disabled={saving}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#FEE2E2]/60 hover:bg-[#FEE2E2] text-[#EF4444] text-xs font-bold rounded-lg transition-colors cursor-pointer border border-[#FEE2E2]"
              >
                <Trash2 size={14} /> Remove Picture
              </button>
            )
          )}
        </div>
      </div>

      {/* 2. Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-[#EBEFF2] overflow-x-auto pb-1">
        {[
          { id: 'overview', label: 'Overview', icon: User },
          { id: 'personal', label: 'Personal Information', icon: FileCheck },
          { id: 'security', label: 'Account & Security', icon: Lock },
          { id: 'preferences', label: 'Preferences', icon: Settings },
          { id: 'employment', label: 'Employment Details', icon: Building2 }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all cursor-pointer whitespace-nowrap border-b-2 ${
                isActive
                  ? 'border-[#111827] bg-white text-[#111827]'
                  : 'border-transparent text-[#6B7280] hover:text-[#111827] hover:bg-white/50'
              }`}
            >
              <Icon size={15} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* 3. Tab Contents */}

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 space-y-6">
            <div className="glass-card bg-white border border-[#EBEFF2] rounded-xl p-5 sm:p-6 shadow-2xs space-y-4">
              <h3 className="font-display text-base font-bold text-[#111827]">Account Profile Summary</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-3 bg-[#F6F8FA] border border-[#EBEFF2] rounded-xl">
                  <span className="text-[#6B7280] font-semibold block">Full Name</span>
                  <span className="text-sm font-bold text-[#111827] mt-0.5 block">{currentUser?.name}</span>
                </div>
                <div className="p-3 bg-[#F6F8FA] border border-[#EBEFF2] rounded-xl">
                  <span className="text-[#6B7280] font-semibold block">Login Email</span>
                  <span className="text-sm font-bold text-[#111827] mt-0.5 block truncate">{currentUser?.email}</span>
                </div>
                <div className="p-3 bg-[#F6F8FA] border border-[#EBEFF2] rounded-xl">
                  <span className="text-[#6B7280] font-semibold block">Contact Phone</span>
                  <span className="text-sm font-bold text-[#111827] mt-0.5 block">{currentUser?.phone || 'Not Provided'}</span>
                </div>
                <div className="p-3 bg-[#F6F8FA] border border-[#EBEFF2] rounded-xl">
                  <span className="text-[#6B7280] font-semibold block">Department & Designation</span>
                  <span className="text-sm font-bold text-[#111827] mt-0.5 block">{currentUser?.department} • {currentUser?.designation}</span>
                </div>
              </div>

              <div className="pt-3 border-t border-[#EBEFF2] flex items-center justify-between text-xs">
                <span className="text-[#6B7280]">Account Created: {new Date(currentUser?.createdAt || Date.now()).toLocaleDateString()}</span>
                <button
                  onClick={() => setActiveTab('personal')}
                  className="text-xs font-bold text-[#111827] hover:underline cursor-pointer"
                >
                  Edit Information →
                </button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-4 space-y-6">
            <div className="glass-card bg-white border border-[#EBEFF2] rounded-xl p-5 shadow-2xs space-y-3">
              <h4 className="text-xs font-bold text-[#111827] uppercase tracking-wider">Account Metadata</h4>
              <div className="space-y-2 text-xs text-[#6B7280]">
                <div className="flex justify-between py-1 border-b border-[#EBEFF2]">
                  <span>Role Scope:</span>
                  <strong className="text-[#111827]">{currentUser?.roleName || 'Employee'}</strong>
                </div>
                <div className="flex justify-between py-1 border-b border-[#EBEFF2]">
                  <span>Office Location:</span>
                  <strong className="text-[#111827]">{currentUser?.officeLocation || 'Main Plant'}</strong>
                </div>
                <div className="flex justify-between py-1 border-b border-[#EBEFF2]">
                  <span>Time Zone:</span>
                  <strong className="text-[#111827]">{currentUser?.timeZone || 'Asia/Kolkata'}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PERSONAL INFORMATION */}
      {activeTab === 'personal' && (
        <form onSubmit={handleSavePersonal} className="glass-card bg-white border border-[#EBEFF2] rounded-xl p-5 sm:p-6 shadow-2xs space-y-6">
          <div className="flex items-center justify-between border-b border-[#EBEFF2] pb-3">
            <div>
              <h3 className="font-display text-base font-bold text-[#111827]">Personal Profile Information</h3>
              <p className="text-xs text-[#6B7280]">Update your personal contact details and display preferences</p>
            </div>
            {hasUnsavedPersonal && (
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-[#FEF3C7] text-[#D97706] animate-pulse">
                Unsaved Changes
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-[#111827] mb-1">Full Name *</label>
              <input
                type="text"
                required
                value={personalForm.name}
                onChange={(e) => handlePersonalChange('name', e.target.value)}
                className="w-full px-3 py-2 border border-[#EBEFF2] rounded-lg bg-[#F6F8FA] text-[#111827] text-xs font-semibold focus:outline-none focus:border-[#111827]"
              />
            </div>

            <div>
              <label className="block font-bold text-[#111827] mb-1">Username / Display Handle</label>
              <input
                type="text"
                value={personalForm.username}
                onChange={(e) => handlePersonalChange('username', e.target.value)}
                className="w-full px-3 py-2 border border-[#EBEFF2] rounded-lg bg-[#F6F8FA] text-[#111827] text-xs font-semibold focus:outline-none focus:border-[#111827]"
              />
            </div>

            <div>
              <label className="block font-bold text-[#111827] mb-1">Contact Phone Number *</label>
              <input
                type="text"
                required
                value={personalForm.phone}
                onChange={(e) => handlePersonalChange('phone', e.target.value)}
                className="w-full px-3 py-2 border border-[#EBEFF2] rounded-lg bg-[#F6F8FA] text-[#111827] text-xs font-semibold focus:outline-none focus:border-[#111827]"
              />
            </div>

            <div>
              <label className="block font-bold text-[#111827] mb-1">Office Location</label>
              <input
                type="text"
                value={personalForm.officeLocation}
                onChange={(e) => handlePersonalChange('officeLocation', e.target.value)}
                className="w-full px-3 py-2 border border-[#EBEFF2] rounded-lg bg-[#F6F8FA] text-[#111827] text-xs font-semibold focus:outline-none focus:border-[#111827]"
              />
            </div>

            <div>
              <label className="block font-bold text-[#111827] mb-1">Preferred Timezone</label>
              <select
                value={personalForm.timeZone}
                onChange={(e) => handlePersonalChange('timeZone', e.target.value)}
                className="w-full px-3 py-2 border border-[#EBEFF2] rounded-lg bg-[#F6F8FA] text-[#111827] text-xs font-semibold focus:outline-none focus:border-[#111827]"
              >
                <option value="Asia/Kolkata">Asia/Kolkata (IST +5:30)</option>
                <option value="UTC">UTC (Coordinated Universal Time)</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-[#111827] mb-1">Date Display Format</label>
              <select
                value={personalForm.dateFormat}
                onChange={(e) => handlePersonalChange('dateFormat', e.target.value)}
                className="w-full px-3 py-2 border border-[#EBEFF2] rounded-lg bg-[#F6F8FA] text-[#111827] text-xs font-semibold focus:outline-none focus:border-[#111827]"
              >
                <option value="DD/MM/YYYY">DD/MM/YYYY (Standard)</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD (ISO Format)</option>
              </select>
            </div>
          </div>

          <div className="pt-4 border-t border-[#EBEFF2] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => loadProfile()}
              className="px-4 py-2 border border-[#EBEFF2] bg-white hover:bg-[#F6F8FA] text-[#111827] text-xs font-semibold rounded-lg transition-colors cursor-pointer"
            >
              Reset Changes
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 bg-[#111827] hover:bg-[#1F2937] text-white text-xs font-bold rounded-lg transition-colors cursor-pointer shadow-xs"
            >
              {saving ? 'Saving...' : 'Save Profile Changes'}
            </button>
          </div>
        </form>
      )}

      {/* TAB 3: ACCOUNT & SECURITY */}
      {activeTab === 'security' && (
        <div className="space-y-6">
          {/* Email Address & Step-Up Verification */}
          <div className="glass-card bg-white border border-[#EBEFF2] rounded-xl p-5 sm:p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-[#EBEFF2] pb-3">
              <div>
                <h3 className="font-display text-base font-bold text-[#111827]">Account Email & Step-Up Verification</h3>
                <p className="text-xs text-[#6B7280]">Email address used for authentication and security alerts</p>
              </div>
              <button
                type="button"
                onClick={() => setShowEmailModal(true)}
                className="px-3.5 py-1.5 bg-[#111827] hover:bg-[#1F2937] text-white text-xs font-bold rounded-lg transition-colors cursor-pointer shadow-xs"
              >
                Change Email Address
              </button>
            </div>

            <div className="flex items-center gap-3 p-3.5 bg-[#F6F8FA] border border-[#EBEFF2] rounded-xl">
              <Mail className="text-[#7C3AED]" size={20} />
              <div>
                <div className="text-xs font-bold text-[#111827]">{currentUser?.email}</div>
                <div className="text-[10px] text-[#6B7280]">Primary verified login credential</div>
              </div>
            </div>
          </div>

          {/* Password Change Form */}
          <form onSubmit={handleChangePasswordSubmit} className="glass-card bg-white border border-[#EBEFF2] rounded-xl p-5 sm:p-6 shadow-2xs space-y-4">
            <div className="border-b border-[#EBEFF2] pb-3">
              <h3 className="font-display text-base font-bold text-[#111827]">Change Security Password</h3>
              <p className="text-xs text-[#6B7280]">Update your account password. Changing password invalidates other active sessions.</p>
            </div>

            <div className="space-y-4 max-w-md text-xs">
              <div>
                <label className="block font-bold text-[#111827] mb-1">Current Password *</label>
                <div className="relative">
                  <input
                    type={showCurrentPass ? 'text' : 'password'}
                    required
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    className="w-full px-3 py-2 pr-10 border border-[#EBEFF2] rounded-lg bg-[#F6F8FA] text-[#111827] text-xs font-semibold focus:outline-none focus:border-[#111827]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPass(!showCurrentPass)}
                    className="absolute right-3 top-2.5 text-[#6B7280]"
                  >
                    {showCurrentPass ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#111827] mb-1">New Password *</label>
                <div className="relative">
                  <input
                    type={showNewPass ? 'text' : 'password'}
                    required
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    className="w-full px-3 py-2 pr-10 border border-[#EBEFF2] rounded-lg bg-[#F6F8FA] text-[#111827] text-xs font-semibold focus:outline-none focus:border-[#111827]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPass(!showNewPass)}
                    className="absolute right-3 top-2.5 text-[#6B7280]"
                  >
                    {showNewPass ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {passwordForm.newPassword && (
                  <div className="mt-2">
                    <PasswordStrengthMeter password={passwordForm.newPassword} />
                  </div>
                )}
              </div>

              <div>
                <label className="block font-bold text-[#111827] mb-1">Confirm New Password *</label>
                <input
                  type="password"
                  required
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  className="w-full px-3 py-2 border border-[#EBEFF2] rounded-lg bg-[#F6F8FA] text-[#111827] text-xs font-semibold focus:outline-none focus:border-[#111827]"
                />
              </div>

              <button
                type="submit"
                disabled={changingPass}
                className="px-5 py-2.5 bg-[#111827] hover:bg-[#1F2937] text-white text-xs font-bold rounded-lg transition-colors cursor-pointer shadow-xs"
              >
                {changingPass ? 'Updating Password...' : 'Update Password & Invalidate Other Sessions'}
              </button>
            </div>
          </form>

          {/* Active Sessions */}
          <div className="glass-card bg-white border border-[#EBEFF2] rounded-xl p-5 sm:p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-[#EBEFF2] pb-3">
              <div>
                <h3 className="font-display text-base font-bold text-[#111827]">Active Login Sessions</h3>
                <p className="text-xs text-[#6B7280]">Currently active web browser sessions</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="p-3.5 bg-[#F6F8FA] border border-[#EBEFF2] rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Monitor className="text-[#111827]" size={20} />
                  <div>
                    <div className="text-xs font-bold text-[#111827]">
                      Desktop Web Browser <span className="text-[10px] text-[#10B981] font-bold ml-1">(This Device)</span>
                    </div>
                    <div className="text-[10px] text-[#6B7280]">Active • Last activity just now</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: PREFERENCES */}
      {activeTab === 'preferences' && (
        <div className="glass-card bg-white border border-[#EBEFF2] rounded-xl p-5 sm:p-6 shadow-2xs space-y-6">
          <div className="border-b border-[#EBEFF2] pb-3">
            <h3 className="font-display text-base font-bold text-[#111827]">Notification & System Preferences</h3>
            <p className="text-xs text-[#6B7280]">Manage system email alerts and table display settings</p>
          </div>

          <div className="space-y-4">
            <h4 className="text-xs font-bold text-[#111827] uppercase tracking-wider">Email Notifications</h4>
            
            <div className="flex items-center justify-between p-3 bg-[#F6F8FA] rounded-xl border border-[#EBEFF2]">
              <div>
                <div className="text-xs font-bold text-[#111827]">Gate Pass Activity Emails</div>
                <div className="text-[10px] text-[#6B7280]">Receive email alerts for gate pass creation and status changes</div>
              </div>
              <input
                type="checkbox"
                checked={preferences.notificationPreferences?.emailGatePass}
                onChange={() => handleToggleNotification('emailGatePass')}
                className="w-4 h-4 text-[#111827] accent-[#111827] cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-[#F6F8FA] rounded-xl border border-[#EBEFF2]">
              <div>
                <div className="text-xs font-bold text-[#111827]">Approval Action Alerts</div>
                <div className="text-[10px] text-[#6B7280]">Receive email notifications when passes or users require approval</div>
              </div>
              <input
                type="checkbox"
                checked={preferences.notificationPreferences?.emailApprovals}
                onChange={() => handleToggleNotification('emailApprovals')}
                className="w-4 h-4 text-[#111827] accent-[#111827] cursor-pointer"
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: EMPLOYMENT DETAILS */}
      {activeTab === 'employment' && (
        <div className="glass-card bg-white border border-[#EBEFF2] rounded-xl p-5 sm:p-6 shadow-2xs space-y-6">
          <div className="border-b border-[#EBEFF2] pb-3">
            <h3 className="font-display text-base font-bold text-[#111827]">Employment & Role Information</h3>
            <p className="text-xs text-[#6B7280]">Protected organization details managed by Company Admin</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3 bg-[#F6F8FA] border border-[#EBEFF2] rounded-xl">
              <span className="text-[#6B7280] font-semibold block">Employee ID / Code</span>
              <span className="text-sm font-bold text-[#111827] mt-0.5 block">{currentUser?.employeeCode || `EMP-${currentUser?.id?.toString().slice(-4).toUpperCase()}`}</span>
            </div>
            <div className="p-3 bg-[#F6F8FA] border border-[#EBEFF2] rounded-xl">
              <span className="text-[#6B7280] font-semibold block">Assigned Company</span>
              <span className="text-sm font-bold text-[#111827] mt-0.5 block">{currentUser?.company?.name || 'Maruti Denim Group'}</span>
            </div>
            <div className="p-3 bg-[#F6F8FA] border border-[#EBEFF2] rounded-xl">
              <span className="text-[#6B7280] font-semibold block">Department</span>
              <span className="text-sm font-bold text-[#111827] mt-0.5 block">{currentUser?.department}</span>
            </div>
            <div className="p-3 bg-[#F6F8FA] border border-[#EBEFF2] rounded-xl">
              <span className="text-[#6B7280] font-semibold block">Designation</span>
              <span className="text-sm font-bold text-[#111827] mt-0.5 block">{currentUser?.designation}</span>
            </div>
          </div>
        </div>
      )}

      {/* STEP-UP EMAIL CHANGE MODAL */}
      {showEmailModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-lg border border-[#EBEFF2] space-y-4">
            <div className="flex items-center justify-between border-b border-[#EBEFF2] pb-3">
              <h3 className="font-bold text-sm text-[#111827]">
                {emailStep === 1 ? 'Step-Up Verification: Email Change' : 'Verify Email Change OTP'}
              </h3>
              <button onClick={() => setShowEmailModal(false)} className="text-[#6B7280] hover:text-[#111827]">
                <X size={18} />
              </button>
            </div>

            {emailStep === 1 ? (
              <form onSubmit={handleRequestEmailChange} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-[#111827] mb-1">Re-authenticate: Current Password *</label>
                  <input
                    type="password"
                    required
                    value={emailForm.currentPassword}
                    onChange={(e) => setEmailForm({ ...emailForm, currentPassword: e.target.value })}
                    className="w-full px-3 py-2 border border-[#EBEFF2] rounded-lg bg-[#F6F8FA] text-[#111827] text-xs font-semibold focus:outline-none focus:border-[#111827]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#111827] mb-1">New Email Address *</label>
                  <input
                    type="email"
                    required
                    value={emailForm.newEmail}
                    onChange={(e) => setEmailForm({ ...emailForm, newEmail: e.target.value })}
                    className="w-full px-3 py-2 border border-[#EBEFF2] rounded-lg bg-[#F6F8FA] text-[#111827] text-xs font-semibold focus:outline-none focus:border-[#111827]"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowEmailModal(false)}
                    className="px-3 py-2 border border-[#EBEFF2] bg-white text-[#111827] font-semibold rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={emailVerifying}
                    className="px-4 py-2 bg-[#111827] text-white font-bold rounded-lg hover:bg-[#1F2937]"
                  >
                    {emailVerifying ? 'Sending Code...' : 'Send Verification OTP'}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleVerifyEmailOTP} className="space-y-4 text-xs text-center">
                <p className="text-xs text-[#6B7280]">
                  Enter 6-digit verification OTP sent to <strong>{emailForm.newEmail}</strong>
                </p>

                <div className="flex justify-center py-2">
                  <OtpInput length={6} value={emailOtp} onChange={setEmailOtp} />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setEmailStep(1)}
                    className="px-3 py-2 border border-[#EBEFF2] bg-white text-[#111827] font-semibold rounded-lg"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={emailVerifying}
                    className="px-4 py-2 bg-[#111827] text-white font-bold rounded-lg hover:bg-[#1F2937]"
                  >
                    {emailVerifying ? 'Verifying...' : 'Verify & Update Email'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
