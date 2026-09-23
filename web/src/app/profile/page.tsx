"use client";

import React from "react";
import { User, Shield, CheckCircle, LogOut, Key } from "lucide-react";
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
      <div className="space-y-5 max-w-4xl mx-auto">
        {/* Header */}
        <div className="pb-4 border-b border-surface-200">
          <h1 className="text-xl font-bold tracking-tight text-surface-900">
            User Account Profile
          </h1>
          <p className="text-xs text-surface-500 mt-1">
            Current session identity, assigned RBAC permissions, and workstation authentication status.
          </p>
        </div>

        {/* User Identity Card */}
        <div className="bg-white border border-surface-200 rounded-lg p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-surface-100 border border-surface-200 flex items-center justify-center text-surface-600">
                <User className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-surface-900 font-mono">{user?.email}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <RoleBadge role={role || "viewer"} />
                  <span className="text-xs text-surface-500 font-mono">
                    Member since {formatDate(user?.created_at)}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={logout}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded text-xs font-semibold bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 shadow-xs transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out of Platform</span>
            </button>
          </div>
        </div>

        {/* Role Permissions Matrix */}
        <div className="bg-white border border-surface-200 rounded-lg p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-4 h-4 text-brand-600" />
            <h4 className="text-sm font-bold text-surface-900">Active Permissions Matrix</h4>
          </div>
          <p className="text-xs text-surface-500 mb-4">
            The following access rights are granted to your account by virtue of your role (
            <span className="font-semibold text-surface-800 capitalize">{role}</span>):
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
            {permissions.map((perm) => (
              <div
                key={perm}
                className="flex items-center gap-2 p-2.5 rounded border border-surface-200 bg-surface-50 text-xs text-surface-800"
              >
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="font-mono text-[11px] font-medium">{perm}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
