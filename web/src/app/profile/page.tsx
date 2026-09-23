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
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="pb-2 border-b border-slate-800">
          <h2 className="text-xl font-bold text-white tracking-tight">User Account Profile</h2>
          <p className="text-xs text-slate-400 mt-1">
            Current session identity, assigned RBAC permissions, and workstation authentication status
          </p>
        </div>

        {/* User Identity Card */}
        <div className="rounded-xl border border-slate-800 bg-[#0E1422] p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                <User className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">{user?.email}</h3>
                <div className="flex items-center gap-2 mt-1.5">
                  <RoleBadge role={role || "viewer"} />
                  <span className="text-xs text-slate-400">
                    Joined {formatDate(user?.created_at)}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={logout}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-semibold transition"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out of PCB-Vision</span>
            </button>
          </div>
        </div>

        {/* Role Permissions Matrix */}
        <div className="rounded-xl border border-slate-800 bg-[#0E1422] p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Shield className="w-4 h-4 text-indigo-400" />
            <h4 className="text-sm font-semibold text-white">Active Permissions Matrix</h4>
          </div>
          <p className="text-xs text-slate-400 mb-4">
            The following access rights are granted to your account by virtue of your role (
            <span className="font-semibold text-slate-300 capitalize">{role}</span>):
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
            {permissions.map((perm) => (
              <div
                key={perm}
                className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200"
              >
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                <span className="font-mono text-[11px]">{perm}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
