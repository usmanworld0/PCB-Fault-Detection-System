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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-[#2D3748]">
                User Directory
              </h1>
            </div>
            <p className="text-xs font-semibold text-[#A0AEC0] mt-0.5">
              Manage user accounts and assigned roles.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[10px] text-xs font-bold uppercase tracking-wider bg-[#4FD1C5] hover:bg-[#319795] text-white shadow-[0_2px_6px_rgba(79,209,197,0.3)] transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              <span>Create User</span>
            </button>
            <button
              onClick={fetchUsersList}
              className="p-2 rounded-[10px] bg-white hover:bg-gray-50 text-[#2D3748] border border-gray-200/80 shadow-[0px_3.5px_5.5px_rgba(0,0,0,0.02)] transition-colors"
              title="Refresh"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-[#4FD1C5] ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* Create User Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-fade-in">
            <div className="w-full max-w-md rounded-[15px] border border-gray-200/70 bg-white p-6 sm:p-7 shadow-2xl animate-fade-in">
              <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-gray-100">
                <h3 className="text-base font-bold text-[#2D3748]">Create New User Account</h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 rounded-lg text-[#A0AEC0] hover:text-[#2D3748] hover:bg-gray-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {formError && (
                <div className="mb-4 p-3 rounded-[10px] bg-red-50 border border-red-200 text-[#E53E3E] text-xs font-medium">
                  {formError}
                </div>
              )}

              <form onSubmit={handleCreateUser} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-[#A0AEC0] uppercase tracking-wider mb-1.5">Email Address</label>
                  <input
                    type="email"
                    required
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="engineer@manufacturing.org"
                    className="w-full px-3.5 py-2.5 bg-white border border-gray-200/80 rounded-[10px] text-xs text-[#2D3748] focus:outline-none focus:ring-1 focus:ring-[#4FD1C5] focus:border-[#4FD1C5] transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[#A0AEC0] uppercase tracking-wider mb-1.5">Temporary Password</label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3.5 py-2.5 bg-white border border-gray-200/80 rounded-[10px] text-xs text-[#2D3748] focus:outline-none focus:ring-1 focus:ring-[#4FD1C5] focus:border-[#4FD1C5] transition-all"
                  />
                  <PasswordStrengthMeter password={newPassword} />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[#A0AEC0] uppercase tracking-wider mb-1.5">Assign System Role</label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as UserRole)}
                    className="w-full px-3.5 py-2.5 bg-white border border-gray-200/80 rounded-[10px] text-xs font-semibold text-[#2D3748] focus:outline-none focus:ring-1 focus:ring-[#4FD1C5] focus:border-[#4FD1C5] transition-all"
                  >
                    <option value="admin">ADMIN (Full Access)</option>
                    <option value="engineer">QUALITY ENGINEER (Review & Inspect)</option>
                    <option value="viewer">VIEWER (Read-Only)</option>
                  </select>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-[10px] text-xs font-bold uppercase tracking-wider text-[#718096] bg-gray-50 hover:bg-gray-100 border border-gray-200/80 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 rounded-[10px] text-xs font-bold uppercase tracking-wider bg-[#4FD1C5] hover:bg-[#319795] text-white shadow-[0_2px_6px_rgba(79,209,197,0.3)] transition-colors disabled:opacity-50"
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
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-fade-in">
            <div className="w-full max-w-md rounded-[15px] border border-gray-200/70 bg-white p-6 shadow-2xl animate-fade-in">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-[10px] bg-rose-50 flex items-center justify-center text-[#E53E3E] shrink-0 mt-0.5">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div className="space-y-1.5 flex-1">
                  <h3 className="text-base font-bold text-[#2D3748]">Delete User Account</h3>
                  <p className="text-xs text-[#718096] leading-relaxed">
                    Are you sure you want to permanently delete user account{" "}
                    <span className="font-bold text-[#2D3748]">{userToDelete.email}</span>?
                    This action will remove their record and credentials from the system. This cannot be undone.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 mt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setUserToDelete(null)}
                  disabled={isDeleting}
                  className="px-4 py-2 rounded-[10px] text-xs font-bold uppercase tracking-wider text-[#718096] bg-gray-50 hover:bg-gray-100 border border-gray-200/80 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteUser}
                  disabled={isDeleting}
                  className="px-4 py-2 rounded-[10px] text-xs font-bold uppercase tracking-wider bg-[#E53E3E] hover:bg-rose-700 text-white shadow-xs transition-colors disabled:opacity-50 inline-flex items-center gap-1.5"
                >
                  {isDeleting ? "Deleting..." : "Delete Account"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Users Table */}
        <div className="bg-white border border-gray-200/70 rounded-[15px] shadow-[0px_3.5px_5.5px_rgba(0,0,0,0.02)] overflow-hidden">
          {error ? (
            <div className="p-6">
              <ErrorState message={error} onRetry={fetchUsersList} />
            </div>
          ) : loading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded-[10px]" />
              ))}
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-gray-100 text-[10px] font-bold uppercase tracking-wider text-[#A0AEC0]">
                      <th className="py-3.5 px-4 font-bold">User Email</th>
                      <th className="py-3.5 px-4 font-bold">Assigned Role</th>
                      <th className="py-3.5 px-4 font-bold">Account Status</th>
                      <th className="py-3.5 px-4 font-bold">Registration Date</th>
                      <th className="py-3.5 px-4 font-bold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {users.map((u) => (
                      <tr key={u.id} className="hover:bg-gray-50/60 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            {u.avatar_url ? (
                              <img
                                src={u.avatar_url}
                                alt={u.email}
                                className="w-8 h-8 rounded-full object-cover border border-[#4FD1C5]/30 shadow-2xs shrink-0"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-teal-50 border border-teal-100 text-[#4FD1C5] font-bold text-xs flex items-center justify-center shrink-0">
                                {u.email.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div className="flex flex-col min-w-0">
                              <span className="font-bold text-xs text-[#2D3748] truncate">{u.email}</span>
                              <span className="text-[10px] text-[#A0AEC0] font-semibold">UID: {u.id.slice(0, 8)}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <select
                            value={u.role}
                            onChange={(e) => handleRoleChange(u.id, e.target.value as UserRole)}
                            className="px-2.5 py-1.5 bg-white border border-gray-200/80 rounded-[8px] text-xs font-semibold text-[#2D3748] focus:outline-none focus:ring-1 focus:ring-[#4FD1C5]"
                          >
                            <option value="admin">ADMIN</option>
                            <option value="engineer">QUALITY ENGINEER</option>
                            <option value="viewer">VIEWER</option>
                          </select>
                        </td>
                        <td className="py-3.5 px-4">
                          {u.is_active ? (
                            <span className="inline-flex items-center gap-1.5 font-bold uppercase tracking-wider text-[#319795] bg-[#E6FFFA] px-2 py-0.5 rounded-[8px] text-[10px]">
                              <CheckCircle2 className="w-3 h-3 text-[#319795]" />
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 font-bold uppercase tracking-wider text-[#E53E3E] bg-[#FFF5F5] px-2 py-0.5 rounded-[8px] text-[10px]">
                              <XCircle className="w-3 h-3 text-[#E53E3E]" />
                              Deactivated
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-[#A0AEC0] font-semibold">{formatDate(u.created_at)}</td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="inline-flex items-center gap-2 justify-end">
                            <button
                              onClick={() => handleToggleStatus(u)}
                              className={`px-3 py-1.5 rounded-[8px] text-xs font-bold border transition-colors ${
                                u.is_active
                                  ? "bg-[#FFF5F5] text-[#E53E3E] border-red-200 hover:bg-red-100"
                                  : "bg-[#E6FFFA] text-[#319795] border-teal-200 hover:bg-teal-100"
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
                              className="p-1.5 rounded-[8px] text-[#A0AEC0] hover:text-[#E53E3E] hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-[#A0AEC0] cursor-pointer disabled:cursor-not-allowed"
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
              <div className="md:hidden divide-y divide-gray-100 font-sans">
                {users.map((u) => (
                  <div key={u.id} className="p-4 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        {u.avatar_url ? (
                          <img
                            src={u.avatar_url}
                            alt={u.email}
                            className="w-7 h-7 rounded-full object-cover border border-[#4FD1C5]/30 shrink-0"
                          />
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-teal-50 border border-teal-100 text-[#4FD1C5] font-bold text-xs flex items-center justify-center shrink-0">
                            {u.email.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <span className="font-bold text-xs text-[#2D3748] truncate">
                          {u.email}
                        </span>
                      </div>
                      {u.is_active ? (
                        <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-[6px] border border-emerald-200 text-[10px] uppercase tracking-wider">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-[6px] border border-rose-200 text-[10px] uppercase tracking-wider">
                          <XCircle className="w-3 h-3 text-rose-600" />
                          Deactivated
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-[10px] text-[#A0AEC0] uppercase font-bold tracking-wider block mb-1">Role</span>
                        <select
                          value={u.role}
                          onChange={(e) => handleRoleChange(u.id, e.target.value as UserRole)}
                          className="w-full px-2 py-1 bg-white border border-gray-200/80 rounded-[8px] text-xs text-[#2D3748] font-bold focus:outline-none focus:ring-1 focus:ring-[#4FD1C5]"
                        >
                          <option value="admin">ADMIN</option>
                          <option value="engineer">ENGINEER</option>
                          <option value="viewer">VIEWER</option>
                        </select>
                      </div>
                      <div>
                        <span className="text-[10px] text-[#A0AEC0] uppercase font-bold tracking-wider block mb-1">Registered</span>
                        <span className="text-[#718096] font-medium text-xs block pt-1">
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
