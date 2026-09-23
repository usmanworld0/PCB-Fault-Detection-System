"use client";

import React, { useEffect, useState } from "react";
import { Cpu, Zap, Target, Gauge, RefreshCw, BarChart2 } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Skeleton } from "@/components/common/LoadingSkeleton";
import { ErrorState } from "@/components/common/ErrorState";
import { getModels } from "@/lib/api/models";
import { ModelMetric } from "@/types/models";
import { DEFECT_LABELS } from "@/lib/constants/defects";

export default function ModelsPage() {
  const [models, setModels] = useState<ModelMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<ModelMetric | null>(null);

  const fetchModels = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getModels();
      setModels(data);
      if (data.length > 0) setSelectedModel(data[0]);
    } catch (err: any) {
      setError(err.message || "Failed to load model registry.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModels();
  }, []);

  return (
    <AppShell>
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">AI Model Registry & Performance</h2>
            <p className="text-xs text-slate-400 mt-1">
              Objective benchmark metrics, accuracy scores, and inference latency for trained defect architectures
            </p>
          </div>
          <button
            onClick={fetchModels}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold bg-surface-100 hover:bg-surface-50 text-slate-200 border border-slate-700 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh Models</span>
          </button>
        </div>

        {error ? (
          <ErrorState message={error} onRetry={fetchModels} />
        ) : loading ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
            <Skeleton className="h-80 w-full" />
          </div>
        ) : models.length === 0 ? (
          <div className="p-12 text-center border border-dashed border-slate-800 rounded-xl bg-surface-200/50">
            <Cpu className="w-10 h-10 text-slate-400 mx-auto mb-2" />
            <h3 className="text-sm font-semibold text-slate-200">No models found in registry.</h3>
            <p className="text-xs text-slate-400 mt-1">
              Models synchronized from the desktop inspection application will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Model Highlight Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {models.map((m) => {
                const isSelected = selectedModel?.id === m.id;
                return (
                  <div
                    key={m.id}
                    onClick={() => setSelectedModel(m)}
                    className={`cursor-pointer rounded-xl border p-4 transition ${
                      isSelected
                        ? "bg-indigo-600/15 border-indigo-500 shadow-md shadow-indigo-950/50"
                        : "bg-[#0E1422] border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-xs font-bold text-white uppercase">{m.name}</span>
                      <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                        {m.arch}
                      </span>
                    </div>
                    <div className="mt-2 flex items-baseline justify-between">
                      <span className="text-xs text-slate-400">mAP@50:</span>
                      <span className="text-lg font-bold text-indigo-400">
                        {m.map50 ? `${(m.map50 * 100).toFixed(1)}%` : "—"}
                      </span>
                    </div>
                    <div className="mt-1 flex items-baseline justify-between text-xs">
                      <span className="text-slate-400">Inference:</span>
                      <span className="font-mono text-slate-300">
                        {m.cpu_ms ? `${m.cpu_ms.toFixed(1)} ms` : "—"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Detailed Benchmark Comparison Table */}
            <div className="rounded-xl border border-slate-800 bg-[#0E1422] p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-semibold text-slate-100">Comparative Architecture Benchmarks</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Empirical metrics recorded during validation on DeepPCB / PKU-Market-PCB datasets
                  </p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400">
                      <th className="py-3 px-3">Model Name</th>
                      <th className="py-3 px-3">Architecture</th>
                      <th className="py-3 px-3">Dataset</th>
                      <th className="py-3 px-3">mAP@50</th>
                      <th className="py-3 px-3">mAP@50:95</th>
                      <th className="py-3 px-3">Precision</th>
                      <th className="py-3 px-3">Recall</th>
                      <th className="py-3 px-3">F1 Score</th>
                      <th className="py-3 px-3">Latency (ms)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {models.map((m) => (
                      <tr
                        key={m.id}
                        onClick={() => setSelectedModel(m)}
                        className={`cursor-pointer transition ${
                          selectedModel?.id === m.id ? "bg-indigo-600/10" : "hover:bg-slate-800/30"
                        }`}
                      >
                        <td className="py-3 px-3 font-mono font-semibold text-white">{m.name}</td>
                        <td className="py-3 px-3 text-slate-300">{m.arch}</td>
                        <td className="py-3 px-3 text-slate-400">{m.dataset || "DeepPCB"}</td>
                        <td className="py-3 px-3 font-bold text-indigo-400">
                          {m.map50 ? `${(m.map50 * 100).toFixed(1)}%` : "—"}
                        </td>
                        <td className="py-3 px-3 text-slate-300">
                          {m.map50_95 ? `${(m.map50_95 * 100).toFixed(1)}%` : "—"}
                        </td>
                        <td className="py-3 px-3 text-slate-300">
                          {m.precision ? `${(m.precision * 100).toFixed(1)}%` : "—"}
                        </td>
                        <td className="py-3 px-3 text-slate-300">
                          {m.recall ? `${(m.recall * 100).toFixed(1)}%` : "—"}
                        </td>
                        <td className="py-3 px-3 text-slate-300">
                          {m.f1 ? `${(m.f1 * 100).toFixed(1)}%` : "—"}
                        </td>
                        <td className="py-3 px-3 font-mono text-emerald-400 font-semibold">
                          {m.cpu_ms ? `${m.cpu_ms.toFixed(1)} ms` : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Selected Model Per-Class Metrics Details */}
            {selectedModel && selectedModel.metrics_json?.per_class_map50_95 && (
              <div className="rounded-xl border border-slate-800 bg-[#0E1422] p-5 shadow-sm">
                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                    <BarChart2 className="w-4 h-4 text-indigo-400" />
                    <span>Per-Class Accuracy for {selectedModel.name} (mAP@50:95)</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Granular detection fidelity across the individual defect categories
                  </p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  {Object.entries(selectedModel.metrics_json.per_class_map50_95).map(
                    ([cls, score]: [string, any]) => (
                      <div key={cls} className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                        <div className="text-[10px] font-semibold uppercase text-slate-400">
                          {DEFECT_LABELS[cls.toLowerCase()] || cls}
                        </div>
                        <div className="mt-1 text-base font-bold text-indigo-300">
                          {(Number(score) * 100).toFixed(1)}%
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}
