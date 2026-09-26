"use client";

import React from "react";
import { User, Shield, CheckCircle, LogOut, Key, CheckCircle2, Lock } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { RoleBadge } from "@/components/common/RoleBadge";
import { useAuth } from "@/lib/auth/AuthContext";
import { ROLE_PERMISSIONS } from "@/lib/constants/permissions";
import { formatDate } from "@/lib/utils";

export default function ProfilePage() {
  const { user, role, logout } = useAuth();
  const permissions = role ? ROLE_PERMISSIONS[role] : [];

  return (
    <AppShell>
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="pb-4 border-b border-surface-200">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-surface-900">
              Profile
            </h1>
          </div>
          <p className="text-xs text-surface-500 mt-1">
            User details and assigned permissions.
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
