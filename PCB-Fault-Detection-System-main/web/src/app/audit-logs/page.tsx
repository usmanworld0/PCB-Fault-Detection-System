"use client";

import React, { useEffect, useState } from "react";
import { History, Shield, Filter, Search, RefreshCw } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { TableSkeleton } from "@/components/common/LoadingSkeleton";
import { ErrorState } from "@/components/common/ErrorState";
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
      return "bg-rose-500/10 text-rose-400 border-rose-500/30";
    }
    if (action.includes("REVIEW")) {
      return "bg-indigo-500/10 text-indigo-400 border-indigo-500/30";
    }
    if (action.includes("USER") || action.includes("ROLE")) {
      return "bg-purple-500/10 text-purple-400 border-purple-500/30";
    }
    if (action.includes("REPORT")) {
      return "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
    }
    return "bg-slate-800 text-slate-300 border-slate-700";
  };

  return (
    <AppShell>
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">System Audit Log</h2>
            <p className="text-xs text-slate-400 mt-1">
              Append-only immutable record of all security authentications, disposition overrides, and management actions
            </p>
          </div>
          <button
            onClick={fetchLogs}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold bg-surface-100 hover:bg-surface-50 text-slate-200 border border-slate-700 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh Trail</span>
          </button>
        </div>

        {/* Filters */}
        <div className="rounded-xl border border-slate-800 bg-[#0E1422] p-4 shadow-sm flex flex-col sm:flex-row gap-3">
          <form onSubmit={handleSearchSubmit} className="relative flex-1">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search by user email..."
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
            />
          </form>

          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
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
        <div className="rounded-xl border border-slate-800 bg-[#0E1422] p-5 shadow-sm">
          {error ? (
            <ErrorState message={error} onRetry={fetchLogs} />
          ) : loading ? (
            <TableSkeleton rows={8} cols={5} />
          ) : logs.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              No audit entries recorded for the current filter.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400">
                    <th className="py-3 px-3">Timestamp</th>
                    <th className="py-3 px-3">User</th>
                    <th className="py-3 px-3">Action</th>
                    <th className="py-3 px-3">Target Entity</th>
                    <th className="py-3 px-3">Description & Audit Context</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-800/30 transition">
                      <td className="py-3 px-3 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                        {formatDate(log.timestamp)}
                      </td>
                      <td className="py-3 px-3 font-medium text-slate-200">
                        {log.user_email || "System"}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded border ${getActionBadge(
                            log.action
                          )}`}
                        >
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-400 capitalize">
                        {log.entity} {log.entity_id ? `(#${log.entity_id.slice(0, 8)})` : ""}
                      </td>
                      <td className="py-3 px-3 text-slate-300 max-w-md">
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
