"use client";

import React, { useEffect, useState } from "react";
import { History, Shield, Filter, Search, RefreshCw } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { TableSkeleton } from "@/components/common/LoadingSkeleton";
import { ErrorState } from "@/components/common/ErrorState";
import { EmptyState } from "@/components/common/EmptyState";
import { getAuditLogs } from "@/lib/api/audit";
import { AuditLog } from "@/types/models";
import { formatDate } from "@/lib/utils";

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [actionFilter, setActionFilter] = useState<string>("");
  const [userSearch, setUserSearch] = useState<string>("");

  const fetchLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getAuditLogs({
        action: actionFilter || undefined,
        user_email: userSearch.trim() || undefined,
        limit: 100,
      });
      setLogs(res.items);
      setTotal(res.total);
    } catch (err: any) {
      setError(err.message || "Failed to load audit logs.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [actionFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLogs();
  };

  const getActionBadge = (action: string) => {
    if (action.includes("OVERRIDE")) {
      return "bg-red-50 text-red-700 border-red-200";
    }
    if (action.includes("REVIEW")) {
      return "bg-brand-50 text-brand-700 border-brand-200";
    }
    if (action.includes("USER") || action.includes("ROLE")) {
      return "bg-purple-50 text-purple-700 border-purple-200";
    }
    if (action.includes("REPORT")) {
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    }
    return "bg-surface-100 text-surface-700 border-surface-200";
  };

  return (
    <AppShell>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-surface-200">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-surface-900">
                System Audit Trail & Compliance Log
              </h1>
              <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-surface-100 text-surface-700 border border-surface-200">
                IMMUTABLE AUDIT
              </span>
            </div>
            <p className="text-xs text-surface-500 mt-1">
              Append-only audit trail recording user authentications, disposition overrides, and management actions.
            </p>
          </div>
          <button
            onClick={fetchLogs}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold bg-white hover:bg-surface-50 text-surface-700 border border-surface-200 shadow-xs transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-surface-500 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh Trail</span>
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white border border-surface-200 rounded-lg p-4 shadow-sm flex flex-col sm:flex-row gap-3">
          <form onSubmit={handleSearchSubmit} className="relative flex-1">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-surface-400" />
            <input
              type="text"
              placeholder="Search by user email or operator account..."
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-surface-50 border border-surface-200 rounded text-xs text-surface-900 placeholder:text-surface-400 focus:outline-none focus:ring-1 focus:ring-brand-500 focus:bg-white font-mono"
            />
          </form>

          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="px-3 py-2 bg-white border border-surface-200 rounded text-xs text-surface-800 focus:outline-none focus:ring-1 focus:ring-brand-500 font-mono"
          >
            <option value="">All Action Types</option>
            <option value="LOGIN">LOGIN</option>
            <option value="INSPECTION_INGESTED">INSPECTION_INGESTED</option>
            <option value="INSPECTION_REVIEWED">INSPECTION_REVIEWED</option>
            <option value="INSPECTION_OVERRIDDEN">INSPECTION_OVERRIDDEN</option>
            <option value="USER_CREATED">USER_CREATED</option>
            <option value="ROLE_CHANGED">ROLE_CHANGED</option>
            <option value="REPORT_GENERATED">REPORT_GENERATED</option>
            <option value="SETTINGS_CHANGED">SETTINGS_CHANGED</option>
          </select>
        </div>

        {/* Audit Log Table */}
        <div className="bg-white border border-surface-200 rounded-lg shadow-sm overflow-hidden">
          {error ? (
            <div className="p-6">
              <ErrorState message={error} onRetry={fetchLogs} />
            </div>
          ) : loading ? (
            <div className="p-4">
              <TableSkeleton rows={8} cols={5} />
            </div>
          ) : logs.length === 0 ? (
            <div className="p-8">
              <EmptyState
                icon={History}
                title="No audit entries found"
                description="No log events match your search or filter criteria."
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-surface-50 border-b border-surface-200 text-[10px] font-mono uppercase tracking-wider text-surface-500">
                    <th className="py-2.5 px-3 font-semibold">Timestamp</th>
                    <th className="py-2.5 px-3 font-semibold">User</th>
                    <th className="py-2.5 px-3 font-semibold">Action</th>
                    <th className="py-2.5 px-3 font-semibold">Target Entity</th>
                    <th className="py-2.5 px-3 font-semibold">Audit Context & Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-100">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-surface-50/80 transition-colors">
                      <td className="py-2.5 px-3 font-mono text-[11px] text-surface-500 whitespace-nowrap">
                        {formatDate(log.timestamp)}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-surface-900 font-medium">
                        {log.user_email || "System"}
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded border ${getActionBadge(
                            log.action
                          )}`}
                        >
                          {log.action}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-surface-600 font-mono text-[11px] capitalize">
                        {log.entity} {log.entity_id ? `(#${log.entity_id.slice(0, 8)})` : ""}
                      </td>
                      <td className="py-2.5 px-3 text-surface-700 max-w-md">
                        {log.description}
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
