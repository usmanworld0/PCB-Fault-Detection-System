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
  Trash2,
  AlertTriangle,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { RoleBadge } from "@/components/common/RoleBadge";
import { Skeleton } from "@/components/common/LoadingSkeleton";
import { ErrorState } from "@/components/common/ErrorState";
import { getUsers, createUser, updateUser, deleteUser } from "@/lib/api/users";
import { User, UserRole } from "@/types/models";
import { formatDate } from "@/lib/utils";
import { PasswordStrengthMeter } from "@/components/common/PasswordStrengthMeter";
import { checkPasswordStrength } from "@/lib/utils/password";
import { useAuth } from "@/lib/auth/AuthContext";

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

  // Delete Confirmation State
  const { user: currentUser } = useAuth();
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    setIsDeleting(true);
    try {
      await deleteUser(userToDelete.id);
      setUserToDelete(null);
      fetchUsersList();
    } catch (err: any) {
      alert(err.message || "Failed to delete user account.");
    } finally {
      setIsDeleting(false);
    }
  };

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

    const strength = checkPasswordStrength(newPassword);
    if (!strength.isValid) {
      setFormError(
        strength.errorMessage ||
          "Password does not meet strong security requirements. Please fulfill all criteria."
      );
      return;
    }

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
                User Directory
              </h1>
            </div>
            <p className="text-xs text-surface-500 mt-1">
              Manage user accounts and assigned roles.
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
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-surface-950/60 backdrop-blur-xs p-4 animate-fade-in">
            <div className="w-full max-w-md rounded-2xl border border-surface-200 bg-white p-6 sm:p-7 shadow-2xl animate-fade-in">
              <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-surface-200">
                <h3 className="text-base font-bold text-surface-900">Create New User Account</h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 rounded-lg text-surface-400 hover:text-surface-700 hover:bg-surface-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {formError && (
                <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
                  {formError}
                </div>
              )}

              <form onSubmit={handleCreateUser} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-surface-700 mb-1.5">Email Address</label>
                  <input
                    type="email"
                    required
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="engineer@manufacturing.org"
                    className="w-full px-3.5 py-2.5 bg-white border border-surface-200 rounded-lg text-xs sm:text-sm text-surface-900 focus:outline-none focus:ring-2 focus:ring-industrial-500/20 focus:border-industrial-500 transition-all font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-surface-700 mb-1.5">Temporary Password</label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3.5 py-2.5 bg-white border border-surface-200 rounded-lg text-xs sm:text-sm text-surface-900 focus:outline-none focus:ring-2 focus:ring-industrial-500/20 focus:border-industrial-500 transition-all font-mono"
                  />
                  <PasswordStrengthMeter password={newPassword} />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-surface-700 mb-1.5">Assign System Role</label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as UserRole)}
                    className="w-full px-3.5 py-2.5 bg-white border border-surface-200 rounded-lg text-xs sm:text-sm text-surface-800 focus:outline-none focus:ring-2 focus:ring-industrial-500/20 focus:border-industrial-500 transition-all font-mono"
                  >
                    <option value="admin">ADMIN (Full Access)</option>
                    <option value="engineer">QUALITY ENGINEER (Review & Inspect)</option>
                    <option value="viewer">VIEWER (Read-Only)</option>
                  </select>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-surface-200">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-lg text-xs font-semibold text-surface-700 bg-surface-100 hover:bg-surface-200 border border-surface-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 rounded-lg text-xs font-semibold bg-industrial-900 hover:bg-industrial-800 text-white shadow-xs transition-colors disabled:opacity-50"
                  >
                    {submitting ? "Creating..." : "Create Account"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {userToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-surface-950/60 backdrop-blur-xs p-4 animate-fade-in">
            <div className="w-full max-w-md rounded-2xl border border-surface-200 bg-white p-6 shadow-2xl animate-fade-in">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 shrink-0 mt-0.5">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div className="space-y-1.5 flex-1">
                  <h3 className="text-base font-bold text-surface-900">Delete User Account</h3>
                  <p className="text-xs text-surface-500 leading-relaxed">
                    Are you sure you want to permanently delete user account{" "}
                    <span className="font-mono font-bold text-surface-900">{userToDelete.email}</span>?
                    This action will remove their record and credentials from the system. This cannot be undone.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-5 mt-4 border-t border-surface-200">
                <button
                  type="button"
                  onClick={() => setUserToDelete(null)}
                  disabled={isDeleting}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-surface-700 bg-surface-100 hover:bg-surface-200 border border-surface-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteUser}
                  disabled={isDeleting}
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition-colors disabled:opacity-50 inline-flex items-center gap-1.5"
                >
                  {isDeleting ? "Deleting..." : "Delete Account"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Users Table */}
        <div className="bg-white border border-surface-200 rounded-xl shadow-xs overflow-hidden">
          {error ? (
            <div className="p-6">
              <ErrorState message={error} onRetry={fetchUsersList} />
            </div>
          ) : loading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded-lg" />
              ))}
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-surface-50 border-b border-surface-200 text-[10px] font-mono uppercase tracking-wider text-surface-500">
                      <th className="py-3 px-4 font-semibold">User Email</th>
                      <th className="py-3 px-4 font-semibold">Assigned Role</th>
                      <th className="py-3 px-4 font-semibold">Account Status</th>
                      <th className="py-3 px-4 font-semibold">Registration Date</th>
                      <th className="py-3 px-4 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-100">
                    {users.map((u) => (
                      <tr key={u.id} className="hover:bg-industrial-50/30 transition-colors">
                        <td className="py-3 px-4 font-mono font-medium text-surface-900">{u.email}</td>
                        <td className="py-3 px-4">
                          <select
                            value={u.role}
                            onChange={(e) => handleRoleChange(u.id, e.target.value as UserRole)}
                            className="px-2.5 py-1.5 bg-white border border-surface-200 rounded-md text-xs text-surface-800 focus:outline-none focus:ring-1 focus:ring-industrial-500 font-mono"
                          >
                            <option value="admin">ADMIN</option>
                            <option value="engineer">QUALITY ENGINEER</option>
                            <option value="viewer">VIEWER</option>
                          </select>
                        </td>
                        <td className="py-3 px-4">
                          {u.is_active ? (
                            <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200 text-[11px]">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 font-semibold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-md border border-rose-200 text-[11px]">
                              <XCircle className="w-3.5 h-3.5 text-rose-600" />
                              Deactivated
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-surface-500 font-mono text-[11px]">{formatDate(u.created_at)}</td>
                        <td className="py-3 px-4 text-right">
                          <div className="inline-flex items-center gap-2 justify-end">
                            <button
                              onClick={() => handleToggleStatus(u)}
                              className={`px-3 py-1.5 rounded-md text-xs font-semibold border transition-colors ${
                                u.is_active
                                  ? "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100"
                                  : "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                              }`}
                            >
                              {u.is_active ? "Deactivate" : "Activate"}
                            </button>
                            <button
                              onClick={() => setUserToDelete(u)}
                              disabled={currentUser?.id === u.id || currentUser?.email === u.email}
                              title={
                                currentUser?.id === u.id || currentUser?.email === u.email
                                  ? "Cannot delete your active account"
                                  : "Delete user account"
                              }
                              className="p-1.5 rounded-md text-surface-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-surface-400 cursor-pointer disabled:cursor-not-allowed"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card List */}
              <div className="md:hidden divide-y divide-surface-200">
                {users.map((u) => (
                  <div key={u.id} className="p-4 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono font-bold text-xs text-surface-900 truncate">
                        {u.email}
                      </span>
                      {u.is_active ? (
                        <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[10px]">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 text-[10px]">
                          <XCircle className="w-3 h-3 text-rose-600" />
                          Deactivated
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-[10px] text-surface-400 uppercase font-mono block mb-1">Role</span>
                        <select
                          value={u.role}
                          onChange={(e) => handleRoleChange(u.id, e.target.value as UserRole)}
                          className="w-full px-2 py-1 bg-white border border-surface-200 rounded text-xs text-surface-800 font-mono"
                        >
                          <option value="admin">ADMIN</option>
                          <option value="engineer">ENGINEER</option>
                          <option value="viewer">VIEWER</option>
                        </select>
                      </div>
                      <div>
                        <span className="text-[10px] text-surface-400 uppercase font-mono block mb-1">Registered</span>
                        <span className="text-surface-600 font-mono text-[11px] block pt-1">
                          {formatDate(u.created_at)}
                        </span>
                      </div>
                    </div>

                    <div className="pt-2 flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleToggleStatus(u)}
                        className={`flex-1 py-1.5 rounded-md text-xs font-semibold border transition-colors ${
                          u.is_active
                            ? "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100"
                            : "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                        }`}
                      >
                        {u.is_active ? "Deactivate" : "Activate"}
                      </button>
                      <button
                        onClick={() => setUserToDelete(u)}
                        disabled={currentUser?.id === u.id || currentUser?.email === u.email}
                        title={
                          currentUser?.id === u.id || currentUser?.email === u.email
                            ? "Cannot delete your active account"
                            : "Delete user account"
                        }
                        className="px-3 py-1.5 rounded-md text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100 transition-colors disabled:opacity-30 disabled:pointer-events-none inline-flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </AppShell>
  );
}
