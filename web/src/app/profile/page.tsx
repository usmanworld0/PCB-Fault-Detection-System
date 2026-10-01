"use client";

import React, { useState, useRef } from "react";
import {
  User,
  Shield,
  CheckCircle,
  LogOut,
  Key,
  CheckCircle2,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  ShieldCheck,
  Camera,
  UploadCloud,
  Trash2,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { RoleBadge } from "@/components/common/RoleBadge";
import { PasswordStrengthMeter } from "@/components/common/PasswordStrengthMeter";
import { useAuth } from "@/lib/auth/AuthContext";
import { ROLE_PERMISSIONS } from "@/lib/constants/permissions";
import { formatDate } from "@/lib/utils";
import { updateUserPassword } from "@/lib/api/auth";
import { checkPasswordStrength } from "@/lib/utils/password";

export default function ProfilePage() {
  const { user, role, logout, updateAvatar } = useAuth();
  const permissions = role ? ROLE_PERMISSIONS[role] : [];
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Avatar update state
  const [isUpdatingAvatar, setIsUpdatingAvatar] = useState(false);
  const [avatarSuccess, setAvatarSuccess] = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState<string | null>(null);

  // Change password state
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setAvatarError("Please select a valid image file (PNG, JPG, WebP).");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setAvatarError("Image file size exceeds the 5MB limit.");
      return;
    }

    setAvatarError(null);
    setAvatarSuccess(null);
    setIsUpdatingAvatar(true);

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64Url = reader.result as string;
        await updateAvatar(base64Url);
        setAvatarSuccess("Custom profile picture uploaded and saved successfully!");
      } catch (err: any) {
        setAvatarError(err.message || "Failed to save profile picture.");
      } finally {
        setIsUpdatingAvatar(false);
      }
    };
    reader.onerror = () => {
      setAvatarError("Failed to read image file.");
      setIsUpdatingAvatar(false);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveAvatar = async () => {
    setAvatarError(null);
    setAvatarSuccess(null);
    setIsUpdatingAvatar(true);
    try {
      await updateAvatar("");
      setAvatarSuccess("Profile picture removed. Reverted to default initials.");
    } catch (err: any) {
      setAvatarError(err.message || "Failed to remove profile picture.");
    } finally {
      setIsUpdatingAvatar(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match. Please verify both inputs.");
      return;
    }

    const strength = checkPasswordStrength(newPassword);
    if (!strength.isValid) {
      setPasswordError(
        strength.errorMessage ||
          "Password does not satisfy strong security requirements."
      );
      return;
    }

    setIsUpdatingPassword(true);
    try {
      await updateUserPassword(newPassword);
      setPasswordSuccess("Your account password has been successfully updated via Supabase Auth.");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setPasswordError(err.message || "Failed to update password.");
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  return (
    <AppShell>
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="pb-2">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-[#2D3748]">
              Profile & Account
            </h1>
          </div>
          <p className="text-xs font-semibold text-[#A0AEC0] mt-1">
            Operator profile details, access permissions, and account security.
          </p>
        </div>

        {/* User Identity Card */}
        <div className="bg-white border border-gray-200/70 rounded-[15px] p-6 sm:p-7 shadow-[0px_3.5px_5.5px_rgba(0,0,0,0.02)]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
            <div className="flex items-center gap-4 min-w-0">
              <div className="relative group shrink-0">
                {user?.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={user.email || "Profile"}
                    className="w-16 h-16 rounded-[14px] object-cover border-2 border-[#4FD1C5]/40 shadow-sm"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-[14px] bg-[#4FD1C5] text-white flex items-center justify-center font-bold text-2xl shadow-[0_2px_6px_rgba(79,209,197,0.3)]">
                    {user?.email?.charAt(0).toUpperCase() || "O"}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-white text-[#2D3748] shadow-md border border-gray-200 hover:text-[#4FD1C5] hover:border-[#4FD1C5] transition-all"
                  title="Change profile picture"
                >
                  <Camera className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="min-w-0">
                <h3 className="text-base sm:text-lg font-bold text-[#2D3748] tracking-tight truncate">
                  {user?.email}
                </h3>
                <div className="flex flex-wrap items-center gap-2 mt-1.5">
                  <RoleBadge role={role || "viewer"} />
                  <span className="text-xs font-semibold text-[#A0AEC0]">
                    Member since {formatDate(user?.created_at)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={logout}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-[10px] text-xs font-bold uppercase tracking-wider bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 shadow-2xs transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>

        {/* Profile Picture & Avatar Management Card */}
        <div className="bg-white border border-gray-200/70 rounded-[15px] p-6 sm:p-7 shadow-[0px_3.5px_5.5px_rgba(0,0,0,0.02)]">
          <div className="flex items-center gap-2.5 mb-2">
            <div className="w-7 h-7 rounded-[8px] bg-[#4FD1C5] text-white flex items-center justify-center shadow-[0_2px_4px_rgba(79,209,197,0.25)]">
              <Camera className="w-4 h-4" />
            </div>
            <h4 className="text-sm font-bold text-[#2D3748]">Profile Picture</h4>
          </div>
          <p className="text-xs text-[#718096] mb-5">
            Upload and manage your personal operator profile photo across PCB Vision.
          </p>

          {avatarSuccess && (
            <div className="mb-4 flex items-start gap-3 p-3.5 rounded-[10px] bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs animate-fade-in font-medium">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
              <span>{avatarSuccess}</span>
            </div>
          )}

          {avatarError && (
            <div className="mb-4 flex items-start gap-3 p-3.5 rounded-[10px] bg-red-50 border border-red-200 text-red-700 text-xs animate-fade-in font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
              <span>{avatarError}</span>
            </div>
          )}

          {/* Hidden File Input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept="image/png,image/jpeg,image/webp,image/gif"
            className="hidden"
          />

          <div className="space-y-5">
            {/* Upload & Remove Actions */}
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUpdatingAvatar}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-[10px] bg-[#4FD1C5] hover:bg-[#319795] text-white text-xs font-bold uppercase tracking-wider shadow-[0_2px_6px_rgba(79,209,197,0.3)] transition-colors disabled:opacity-40"
              >
                <UploadCloud className="w-4 h-4" />
                <span>{isUpdatingAvatar ? "Uploading..." : "Upload PFP"}</span>
              </button>

              {user?.avatar_url && (
                <button
                  type="button"
                  onClick={handleRemoveAvatar}
                  disabled={isUpdatingAvatar}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-[10px] bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold uppercase tracking-wider border border-rose-200 transition-colors disabled:opacity-40"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove PFP</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Password & Security Management */}
        <div className="bg-white border border-gray-200/70 rounded-[15px] p-6 sm:p-7 shadow-[0px_3.5px_5.5px_rgba(0,0,0,0.02)]">
          <div className="flex items-center gap-2.5 mb-2">
            <div className="w-7 h-7 rounded-[8px] bg-[#4FD1C5] text-white flex items-center justify-center shadow-[0_2px_4px_rgba(79,209,197,0.25)]">
              <Key className="w-4 h-4" />
            </div>
            <h4 className="text-sm font-bold text-[#2D3748]">Change Account Password</h4>
          </div>
          <p className="text-xs text-[#718096] mb-5">
            Update your authentication password managed securely via Supabase Auth. Strong password criteria are enforced.
          </p>

          {passwordSuccess && (
            <div className="mb-4 flex items-start gap-3 p-3.5 rounded-[10px] bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs animate-fade-in font-medium">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
              <span>{passwordSuccess}</span>
            </div>
          )}

          {passwordError && (
            <div className="mb-4 flex items-start gap-3 p-3.5 rounded-[10px] bg-red-50 border border-red-200 text-red-700 text-xs animate-fade-in font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
              <span>{passwordError}</span>
            </div>
          )}

          <form onSubmit={handlePasswordChange} className="space-y-4 max-w-xl">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#A0AEC0] mb-1.5">
                New Strong Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="w-full pl-10 pr-10 py-2.5 bg-white border border-gray-200/80 rounded-[10px] text-xs sm:text-sm text-[#2D3748] placeholder:text-[#A0AEC0] focus:outline-none focus:ring-2 focus:ring-[#4FD1C5]/20 focus:border-[#4FD1C5] transition-all font-sans shadow-xs"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Real-time strong password checklist */}
              <PasswordStrengthMeter password={newPassword} />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#A0AEC0] mb-1.5">
                Confirm New Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="w-full pl-10 pr-10 py-2.5 bg-white border border-gray-200/80 rounded-[10px] text-xs sm:text-sm text-[#2D3748] placeholder:text-[#A0AEC0] focus:outline-none focus:ring-2 focus:ring-[#4FD1C5]/20 focus:border-[#4FD1C5] transition-all font-sans shadow-xs"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {confirmPassword && newPassword !== confirmPassword && (
                <p className="text-[11px] text-rose-600 mt-1 font-medium">Passwords do not match</p>
              )}
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={
                  isUpdatingPassword ||
                  !checkPasswordStrength(newPassword).isValid ||
                  newPassword !== confirmPassword
                }
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[10px] bg-[#4FD1C5] hover:bg-[#319795] text-white text-xs font-bold uppercase tracking-wider shadow-[0_2px_6px_rgba(79,209,197,0.3)] transition-colors disabled:opacity-40"
              >
                {isUpdatingPassword ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Updating Password...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Update Password</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Role Permissions Matrix */}
        <div className="bg-white border border-gray-200/70 rounded-[15px] p-6 sm:p-7 shadow-[0px_3.5px_5.5px_rgba(0,0,0,0.02)]">
          <div className="flex items-center gap-2.5 mb-2">
            <div className="w-7 h-7 rounded-[8px] bg-[#4FD1C5] text-white flex items-center justify-center shadow-[0_2px_4px_rgba(79,209,197,0.25)]">
              <Shield className="w-4 h-4" />
            </div>
            <h4 className="text-sm font-bold text-[#2D3748]">Permissions</h4>
          </div>
          <p className="text-xs text-[#718096] mb-4">
            Assigned access rights for your role (<span className="font-bold text-[#2D3748] capitalize">{role}</span>):
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {permissions.map((perm) => (
              <div
                key={perm}
                className="flex items-center gap-2.5 p-3 rounded-[10px] border border-gray-100 bg-[#F8F9FA] text-xs text-[#2D3748] font-bold hover:border-teal-200 transition-colors"
              >
                <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <CheckCircle className="w-3.5 h-3.5" />
                </div>
                <span className="text-[11px] font-semibold">{perm}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
