"use client";

import React, { useState } from "react";
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
  const { user, role, logout } = useAuth();
  const permissions = role ? ROLE_PERMISSIONS[role] : [];

  // Change password state
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

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
        <div className="pb-4 border-b border-surface-200">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-surface-900">
              Profile & Account
            </h1>
          </div>
          <p className="text-xs text-surface-500 mt-1">
            Operator profile details, access permissions, and account security.
          </p>
        </div>

        {/* User Identity Card */}
        <div className="bg-white border border-surface-200 rounded-2xl p-6 sm:p-7 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-industrial-900 border border-industrial-800 text-white flex items-center justify-center font-mono font-bold text-xl shadow-md">
                {user?.email?.charAt(0).toUpperCase() || "O"}
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-surface-900 font-mono tracking-tight">
                  {user?.email}
                </h3>
                <div className="flex flex-wrap items-center gap-2 mt-1.5">
                  <RoleBadge role={role || "viewer"} />
                  <span className="text-xs text-surface-500 font-mono">
                    Member since {formatDate(user?.created_at)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={logout}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 shadow-2xs transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>

        {/* Password & Security Management */}
        <div className="bg-white border border-surface-200 rounded-2xl p-6 sm:p-7 shadow-xs">
          <div className="flex items-center gap-2.5 mb-2">
            <div className="p-1.5 rounded-lg bg-industrial-50 text-industrial-700 border border-industrial-200">
              <Key className="w-4 h-4" />
            </div>
            <h4 className="text-sm font-bold text-surface-900">Change Account Password</h4>
          </div>
          <p className="text-xs text-surface-500 mb-5">
            Update your authentication password managed securely via Supabase Auth. Strong password criteria are enforced.
          </p>

          {passwordSuccess && (
            <div className="mb-4 flex items-start gap-3 p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs animate-fade-in font-medium">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
              <span>{passwordSuccess}</span>
            </div>
          )}

          {passwordError && (
            <div className="mb-4 flex items-start gap-3 p-3.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs animate-fade-in font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
              <span>{passwordError}</span>
            </div>
          )}

          <form onSubmit={handlePasswordChange} className="space-y-4 max-w-xl">
            <div>
              <label className="block text-xs font-semibold text-surface-700 mb-1.5">
                New Strong Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-surface-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="w-full pl-10 pr-10 py-2.5 bg-white border border-surface-200 rounded-lg text-xs sm:text-sm text-surface-900 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-industrial-500/20 focus:border-industrial-500 transition-all font-mono shadow-xs"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-surface-400 hover:text-surface-600 transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Real-time strong password checklist */}
              <PasswordStrengthMeter password={newPassword} />
            </div>

            <div>
              <label className="block text-xs font-semibold text-surface-700 mb-1.5">
                Confirm New Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-surface-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="w-full pl-10 pr-10 py-2.5 bg-white border border-surface-200 rounded-lg text-xs sm:text-sm text-surface-900 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-industrial-500/20 focus:border-industrial-500 transition-all font-mono shadow-xs"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-surface-400 hover:text-surface-600 transition-colors"
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {confirmPassword && newPassword !== confirmPassword && (
                <p className="text-[11px] text-rose-600 font-mono mt-1">Passwords do not match</p>
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
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-industrial-900 hover:bg-industrial-800 text-white text-xs font-semibold shadow-xs transition-colors disabled:opacity-40"
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
        <div className="bg-white border border-surface-200 rounded-2xl p-6 sm:p-7 shadow-xs">
          <div className="flex items-center gap-2.5 mb-2">
            <div className="p-1.5 rounded-lg bg-industrial-50 text-industrial-700 border border-industrial-200">
              <Shield className="w-4 h-4" />
            </div>
            <h4 className="text-sm font-bold text-surface-900">Permissions</h4>
          </div>
          <p className="text-xs text-surface-500 mb-4">
            Assigned access rights for your role (<span className="font-semibold text-surface-800 capitalize">{role}</span>):
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {permissions.map((perm) => (
              <div
                key={perm}
                className="flex items-center gap-2.5 p-3 rounded-xl border border-surface-200 bg-surface-50 text-xs text-surface-800 hover:border-industrial-200 transition-colors"
              >
                <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <CheckCircle className="w-3.5 h-3.5" />
                </div>
                <span className="font-mono text-[11px] font-medium">{perm}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
