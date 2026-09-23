"use client";

import React, { useEffect, useState } from "react";
import {
  Users,
  UserPlus,
  Shield,
  CheckCircle2,
  XCircle,
  RefreshCw,
  MoreVertical,
  X,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { RoleBadge } from "@/components/common/RoleBadge";
import { Skeleton } from "@/components/common/LoadingSkeleton";
import { ErrorState } from "@/components/common/ErrorState";
import { getUsers, createUser, updateUser } from "@/lib/api/users";
import { User, UserRole } from "@/types/models";
import { formatDate } from "@/lib/utils";

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create User Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState<UserRole>("engineer");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchUsersList = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getUsers();
      setUsers(data);
    } catch (err: any) {
      setError(err.message || "Failed to load users list.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsersList();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);
    try {
      await createUser({
        email: newEmail.trim().toLowerCase(),
        password: newPassword,
        role: newRole,
      });
      setIsModalOpen(false);
      setNewEmail("");
      setNewPassword("");
      fetchUsersList();
    } catch (err: any) {
      setFormError(err.message || "Failed to create user.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (user: User) => {
    try {
      await updateUser(user.id, { is_active: !user.is_active });
      fetchUsersList();
    } catch (err: any) {
      alert(err.message || "Failed to update user status.");
    }
  };

  const handleRoleChange = async (userId: string, role: UserRole) => {
    try {
      await updateUser(userId, { role });
      fetchUsersList();
    } catch (err: any) {
      alert(err.message || "Failed to change user role.");
    }
  };

  return (
    <AppShell>
      <div className="space-y-5 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-surface-200">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-surface-900">
                User & Operator Directory
              </h1>
              <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-surface-100 text-surface-700 border border-surface-200">
                RBAC ACCESS
              </span>
            </div>
            <p className="text-xs text-surface-500 mt-1">
              Administer system accounts and assign RBAC permissions (Admin, Quality Engineer, Viewer).
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded text-xs font-semibold bg-brand-600 hover:bg-brand-700 text-white shadow-xs transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              <span>Create User</span>
            </button>
            <button
              onClick={fetchUsersList}
              className="p-1.5 rounded bg-white hover:bg-surface-50 text-surface-700 border border-surface-200 shadow-xs transition-colors"
              title="Refresh"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-surface-500 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* Create User Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-surface-950/40 backdrop-blur-xs p-4">
            <div className="w-full max-w-md rounded-lg border border-surface-200 bg-white p-6 shadow-xl">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-surface-200">
                <h3 className="text-sm font-bold text-surface-900">Create New User Account</h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 rounded text-surface-400 hover:text-surface-700 hover:bg-surface-100 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {formError && (
                <div className="mb-4 p-2.5 rounded bg-red-50 border border-red-200 text-red-700 text-xs">
                  {formError}
                </div>
              )}

              <form onSubmit={handleCreateUser} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-surface-800 mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="engineer@manufacturing.org"
                    className="w-full p-2 bg-white border border-surface-200 rounded text-xs text-surface-900 focus:outline-none focus:ring-1 focus:ring-brand-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-surface-800 mb-1">Temporary Password</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full p-2 bg-white border border-surface-200 rounded text-xs text-surface-900 focus:outline-none focus:ring-1 focus:ring-brand-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-surface-800 mb-1">Assign System Role</label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as UserRole)}
                    className="w-full p-2 bg-white border border-surface-200 rounded text-xs text-surface-800 focus:outline-none focus:ring-1 focus:ring-brand-500 font-mono"
                  >
                    <option value="admin">ADMIN (Full Access)</option>
                    <option value="engineer">QUALITY ENGINEER (Review & Inspect)</option>
                    <option value="viewer">VIEWER (Read-Only)</option>
                  </select>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-surface-200">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-3 py-1.5 rounded text-xs font-semibold text-surface-700 bg-surface-100 hover:bg-surface-200 border border-surface-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-1.5 rounded text-xs font-semibold bg-brand-600 hover:bg-brand-700 text-white shadow-xs transition-colors disabled:opacity-50"
                  >
                    {submitting ? "Creating..." : "Create Account"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Users Table */}
        <div className="bg-white border border-surface-200 rounded-lg shadow-sm overflow-hidden">
          {error ? (
            <div className="p-6">
              <ErrorState message={error} onRetry={fetchUsersList} />
            </div>
          ) : loading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded" />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-surface-50 border-b border-surface-200 text-[10px] font-mono uppercase tracking-wider text-surface-500">
                    <th className="py-2.5 px-3 font-semibold">User Email</th>
                    <th className="py-2.5 px-3 font-semibold">Assigned Role</th>
                    <th className="py-2.5 px-3 font-semibold">Account Status</th>
                    <th className="py-2.5 px-3 font-semibold">Registration Date</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-100">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-surface-50/80 transition-colors">
                      <td className="py-2.5 px-3 font-mono font-medium text-surface-900">{u.email}</td>
                      <td className="py-2.5 px-3">
                        <select
                          value={u.role}
                          onChange={(e) => handleRoleChange(u.id, e.target.value as UserRole)}
                          className="px-2 py-1 bg-white border border-surface-200 rounded text-xs text-surface-800 focus:outline-none focus:ring-1 focus:ring-brand-500 font-mono"
                        >
                          <option value="admin">ADMIN</option>
                          <option value="engineer">QUALITY ENGINEER</option>
                          <option value="viewer">VIEWER</option>
                        </select>
                      </td>
                      <td className="py-2.5 px-3">
                        {u.is_active ? (
                          <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[11px]">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 font-semibold text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-200 text-[11px]">
                            <XCircle className="w-3.5 h-3.5 text-red-600" />
                            Deactivated
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-surface-500 font-mono text-[11px]">{formatDate(u.created_at)}</td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={() => handleToggleStatus(u)}
                          className={`px-2.5 py-1 rounded text-xs font-semibold border transition-colors ${
                            u.is_active
                              ? "bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                              : "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                          }`}
                        >
                          {u.is_active ? "Deactivate" : "Activate"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
