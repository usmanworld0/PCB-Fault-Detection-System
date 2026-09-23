"use client";

import React, { useEffect, useState } from "react";
import { Cpu, Zap, Target, Gauge, RefreshCw, BarChart2, CheckCircle2 } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Skeleton } from "@/components/common/LoadingSkeleton";
import { ErrorState } from "@/components/common/ErrorState";
import { EmptyState } from "@/components/common/EmptyState";
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
      <div className="space-y-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-surface-200">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-surface-900">
                Model Registry & Benchmark Telemetry
              </h1>
              <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-surface-100 text-surface-700 border border-surface-200">
                EVALUATION BENCHMARK
              </span>
            </div>
            <p className="text-xs text-surface-500 mt-1">
              Objective benchmark metrics, accuracy scores, and inference latency for trained defect architectures.
            </p>
          </div>
          <button
            onClick={fetchModels}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold bg-white hover:bg-surface-50 text-surface-700 border border-surface-200 shadow-sm transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-surface-500 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh Models</span>
          </button>
        </div>

        {error ? (
          <ErrorState message={error} onRetry={fetchModels} />
        ) : loading ? (
          <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-32 w-full rounded-lg" />
              ))}
            </div>
            <Skeleton className="h-80 w-full rounded-lg" />
          </div>
        ) : models.length === 0 ? (
          <EmptyState
            icon={Cpu}
            title="No models found in registry"
            description="Models registered in Supabase will appear here once connected."
          />
        ) : (
          <div className="space-y-5">
            {/* Model Highlight Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {models.map((m) => {
                const isSelected = selectedModel?.id === m.id;
                return (
                  <div
                    key={m.id}
                    onClick={() => setSelectedModel(m)}
                    className={`cursor-pointer rounded-lg border p-4 transition-colors ${
                      isSelected
                        ? "bg-white border-brand-500 ring-2 ring-brand-500/20 shadow-sm"
                        : "bg-white border-surface-200 hover:border-surface-300 shadow-xs"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-xs font-bold text-surface-900 uppercase">{m.name}</span>
                      <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-surface-100 text-surface-700 border border-surface-200">
                        {m.arch}
                      </span>
                    </div>
                    <div className="mt-3 flex items-baseline justify-between">
                      <span className="text-xs text-surface-500">mAP@50:</span>
                      <span className="text-lg font-bold text-brand-700 font-mono">
                        {m.map50 ? `${(m.map50 * 100).toFixed(1)}%` : "—"}
                      </span>
                    </div>
                    <div className="mt-1 flex items-baseline justify-between text-xs">
                      <span className="text-surface-500">Inference:</span>
                      <span className="font-mono text-surface-800 font-medium">
                        {m.cpu_ms ? `${m.cpu_ms.toFixed(1)} ms` : "—"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Detailed Benchmark Comparison Table */}
            <div className="bg-white border border-surface-200 rounded-lg shadow-sm overflow-hidden">
              <div className="p-4 border-b border-surface-200 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-surface-900 tracking-tight">Comparative Architecture Benchmarks</h3>
                  <p className="text-xs text-surface-500 mt-0.5">
                    Empirical metrics recorded during validation on DeepPCB / PKU-Market-PCB datasets
                  </p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-surface-50 border-b border-surface-200 text-[10px] font-mono uppercase tracking-wider text-surface-500">
                      <th className="py-2.5 px-3 font-semibold">Model Name</th>
                      <th className="py-2.5 px-3 font-semibold">Architecture</th>
                      <th className="py-2.5 px-3 font-semibold">Dataset</th>
                      <th className="py-2.5 px-3 font-semibold">mAP@50</th>
                      <th className="py-2.5 px-3 font-semibold">mAP@50:95</th>
                      <th className="py-2.5 px-3 font-semibold">Precision</th>
                      <th className="py-2.5 px-3 font-semibold">Recall</th>
                      <th className="py-2.5 px-3 font-semibold">F1 Score</th>
                      <th className="py-2.5 px-3 font-semibold">Latency (ms)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-100">
                    {models.map((m) => (
                      <tr
                        key={m.id}
                        onClick={() => setSelectedModel(m)}
                        className={`cursor-pointer transition-colors ${
                          selectedModel?.id === m.id ? "bg-brand-50/60" : "hover:bg-surface-50/80"
                        }`}
                      >
                        <td className="py-2.5 px-3 font-mono font-semibold text-surface-900">{m.name}</td>
                        <td className="py-2.5 px-3 text-surface-700">{m.arch}</td>
                        <td className="py-2.5 px-3 font-mono text-surface-500">{m.dataset || "DeepPCB"}</td>
                        <td className="py-2.5 px-3 font-bold text-brand-700 font-mono">
                          {m.map50 ? `${(m.map50 * 100).toFixed(1)}%` : "—"}
                        </td>
                        <td className="py-2.5 px-3 text-surface-700 font-mono">
                          {m.map50_95 ? `${(m.map50_95 * 100).toFixed(1)}%` : "—"}
                        </td>
                        <td className="py-2.5 px-3 text-surface-700 font-mono">
                          {m.precision ? `${(m.precision * 100).toFixed(1)}%` : "—"}
                        </td>
                        <td className="py-2.5 px-3 text-surface-700 font-mono">
                          {m.recall ? `${(m.recall * 100).toFixed(1)}%` : "—"}
                        </td>
                        <td className="py-2.5 px-3 text-surface-700 font-mono">
                          {m.f1 ? `${(m.f1 * 100).toFixed(1)}%` : "—"}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-emerald-700 font-semibold">
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
              <div className="bg-white border border-surface-200 rounded-lg p-5 shadow-sm">
                <div className="mb-4">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-surface-900">
                      Per-Class Accuracy Breakdown: {selectedModel.name}
                    </h3>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-surface-100 text-surface-600 border border-surface-200">
                      mAP@50:95
                    </span>
                  </div>
                  <p className="text-xs text-surface-500 mt-0.5">
                    Granular detection fidelity across the individual PCB defect categories
                  </p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  {Object.entries(selectedModel.metrics_json.per_class_map50_95).map(
                    ([cls, score]: [string, any]) => (
                      <div key={cls} className="p-3 rounded border border-surface-200 bg-surface-50">
                        <div className="text-[10px] font-mono uppercase font-semibold text-surface-500">
                          {DEFECT_LABELS[cls.toLowerCase()] || cls}
                        </div>
                        <div className="mt-1 text-base font-bold text-brand-700 font-mono">
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
